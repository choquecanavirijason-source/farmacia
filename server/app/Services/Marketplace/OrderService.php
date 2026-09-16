<?php

namespace App\Services\Marketplace;

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
}
