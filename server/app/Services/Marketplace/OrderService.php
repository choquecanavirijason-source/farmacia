<?php

namespace App\Services\Marketplace;

use App\Models\Batch;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\Medicament;
use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function getPaginatedForUser(User $user, array $filters, int $perPage = 10, string $sortBy = 'created_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return $user->orders()
            ->with('details.medicament')
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getByIdForUser(User $user, int $id): Order
    {
        return $user->orders()
            ->with('details.medicament', 'branch')
            ->findOrFail($id);
    }

    /**
     * Crea el pedido a partir del carrito. No descuenta stock de ningun lote
     * todavia: eso pasa recien cuando el staff confirma el pedido y elige la
     * sucursal que lo va a preparar (fuera del alcance de este metodo).
     */
    public function create(User $user, array $data): Order
    {
        $medicamentIds = collect($data['items'])->pluck('medicament_id')->unique();
        $medicaments = Medicament::query()
            ->where('status', 'active')
            ->withSum('batches as total_stock', 'current_quantity')
            ->whereIn('id', $medicamentIds)
            ->get()
            ->keyBy('id');

        $total = 0;
        $itemsToCreate = [];

        foreach ($data['items'] as $item) {
            $medicament = $medicaments->get($item['medicament_id']);

            if (!$medicament) {
                throw ValidationException::withMessages([
                    'items' => ["Uno de los productos ya no está disponible."],
                ]);
            }

            $availableStock = (int) ($medicament->total_stock ?? 0);
            if ($availableStock < $item['quantity']) {
                throw ValidationException::withMessages([
                    'items' => ["No hay suficiente stock de \"{$medicament->name}\" (disponible: {$availableStock})."],
                ]);
            }

            $subtotal = round((float) $medicament->price * $item['quantity'], 2);
            $total += $subtotal;

            $itemsToCreate[] = [
                'medicament_id' => $medicament->id,
                'quantity'      => $item['quantity'],
                'unit_price'    => $medicament->price,
                'subtotal'      => $subtotal,
            ];
        }

        return DB::transaction(function () use ($user, $data, $total, $itemsToCreate) {
            $order = Order::create([
                'user_id'       => $user->id,
                'total'         => $total,
                'contact_name'  => $data['contact_name'],
                'contact_phone' => $data['contact_phone'],
                'notes'         => $data['notes'] ?? null,
                'created_id'    => $user->id,
            ]);

            $order->details()->createMany($itemsToCreate);

            return $order->load('details.medicament');
        });
    }

    /**
     * Transiciones validas: pending -> confirmed|cancelled, confirmed ->
     * ready|cancelled, ready -> completed|cancelled. completed/cancelled
     * son estados finales.
     */
    private const VALID_TRANSITIONS = [
        'pending'   => ['confirmed', 'cancelled'],
        'confirmed' => ['ready', 'cancelled'],
        'ready'     => ['completed', 'cancelled'],
    ];

    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'created_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return Order::query()
            ->with(['user', 'branch'])
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getById(int $id): Order
    {
        return Order::with(['user', 'branch', 'details.medicament'])->findOrFail($id);
    }

    public function updateStatus(Order $order, string $newStatus, ?int $branchId, User $actor): Order
    {
        $allowed = self::VALID_TRANSITIONS[$order->status] ?? [];
        if (!in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => ["No se puede pasar de \"{$order->status}\" a \"{$newStatus}\"."],
            ]);
        }

        return match ($newStatus) {
            'confirmed' => $this->confirm($order, $branchId, $actor),
            'ready'     => $this->markReady($order, $actor),
            'completed' => $this->complete($order, $actor),
            'cancelled' => $this->cancel($order, $actor),
        };
    }

    private function confirm(Order $order, int $branchId, User $actor): Order
    {
        $branch = Branch::findOrFail($branchId);

        foreach ($order->details as $detail) {
            $available = (int) Batch::where('medicament_id', $detail->medicament_id)
                ->where('branch_id', $branch->id)
                ->sum('current_quantity');

            if ($available < $detail->quantity) {
                throw ValidationException::withMessages([
                    'branch_id' => ["\"{$branch->name}\" no tiene suficiente stock de {$detail->medicament->name} (disponible: {$available})."],
                ]);
            }
        }

        $order->update([
            'branch_id'    => $branch->id,
            'status'       => 'confirmed',
            'confirmed_at' => now(),
            'updated_id'   => $actor->id,
        ]);

        return $order->fresh(['user', 'branch', 'details.medicament']);
    }

    private function markReady(Order $order, User $actor): Order
    {
        $order->update(['status' => 'ready', 'updated_id' => $actor->id]);

        return $order->fresh(['user', 'branch', 'details.medicament']);
    }

    /**
     * Descuenta el stock real (un solo lote por item, el mas proximo a vencer
     * primero) de la sucursal asignada, igual que una venta de mostrador, y
     * deja el movimiento de inventario para el kardex. No genera un
     * Sale/Invoice: eso requeriria una caja abierta y un cajero, que un
     * pedido online no tiene.
     */
    private function complete(Order $order, User $actor): Order
    {
        DB::transaction(function () use ($order, $actor) {
            foreach ($order->details as $detail) {
                $batch = Batch::where('medicament_id', $detail->medicament_id)
                    ->where('branch_id', $order->branch_id)
                    ->where('current_quantity', '>=', $detail->quantity)
                    ->orderBy('expiration_date')
                    ->first();

                if (!$batch) {
                    throw ValidationException::withMessages([
                        'items' => ["Ya no hay stock suficiente de {$detail->medicament->name} en la sucursal asignada."],
                    ]);
                }

                $balance = $batch->current_quantity - $detail->quantity;
                $batch->update(['current_quantity' => $balance]);

                InventoryMovement::create([
                    'batch_id'    => $batch->id,
                    'type'        => 'out',
                    'quantity'    => -$detail->quantity,
                    'balance'     => $balance,
                    'reason'      => "Pedido marketplace {$order->order_number}",
                    'occurred_at' => now(),
                ]);
            }

            $order->update([
                'status'       => 'completed',
                'completed_at' => now(),
                'updated_id'   => $actor->id,
            ]);
        });

        return $order->fresh(['user', 'branch', 'details.medicament']);
    }

    private function cancel(Order $order, User $actor): Order
    {
        $order->update(['status' => 'cancelled', 'updated_id' => $actor->id]);

        return $order->fresh(['user', 'branch', 'details.medicament']);
    }
}
