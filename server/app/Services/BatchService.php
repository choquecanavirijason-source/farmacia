<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Batch;
use App\Models\InventoryAdjustment;
use App\Models\InventoryMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class BatchService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'expiration_date', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return Batch::withTrashed()
            ->with('medicament')
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Batch
    {
        return DB::transaction(function () use ($data) {
            $batch = Batch::create($data);

            InventoryMovement::create([
                'batch_id'    => $batch->id,
                'type'        => 'in',
                'quantity'    => $batch->current_quantity,
                'balance'     => $batch->current_quantity,
                'reason'      => 'Registro inicial de lote',
                'occurred_at' => now(),
            ]);

            return $batch;
        });
    }

    public function update(Batch $batch, array $data): Batch
    {
        $batch->update($data);
        return $batch->refresh();
    }

    public function delete(int $id): void
    {
        Batch::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $batches = Batch::whereIn('id', $ids)->get();
        foreach ($batches as $batch) {
            $batch->delete();
        }
        return $batches->count();
    }

    public function restore(int $id): Batch
    {
        $batch = Batch::onlyTrashed()->findOrFail($id);
        $batch->restore();
        return $batch;
    }

    public function getKardex(int $id): Collection
    {
        Batch::withTrashed()->findOrFail($id);
        return InventoryMovement::where('batch_id', $id)->orderByDesc('occurred_at')->get();
    }

    public function moveStock(int $id, int $quantity, string $reason, string $type, int $sign): Batch
    {
        $batch = Batch::findOrFail($id);

        if ($type === 'out' && $quantity > $batch->current_quantity) {
            throw ValidationException::withMessages([
                'cantidad' => ["Stock insuficiente en el lote {$batch->batch_number}."],
            ]);
        }

        return DB::transaction(function () use ($batch, $quantity, $reason, $type, $sign) {
            $balance = $batch->current_quantity + ($sign * $quantity);
            $batch->update(['current_quantity' => $balance]);

            InventoryMovement::create([
                'batch_id'    => $batch->id,
                'type'        => $type,
                'quantity'    => $sign * $quantity,
                'balance'     => $balance,
                'reason'      => $reason,
                'occurred_at' => now(),
            ]);

            return $batch;
        });
    }

    public function dispose(int $id, int $quantity, string $reason, int $userId): Batch
    {
        $batch = Batch::findOrFail($id);

        if ($quantity > $batch->current_quantity) {
            throw ValidationException::withMessages([
                'cantidad' => ["La cantidad debe estar entre 1 y {$batch->current_quantity}."],
            ]);
        }

        $reasonMap = [
            'Vencimiento' => 'expiration',
            'Daño'        => 'damage',
            'Extravío'    => 'loss',
            'Otro'        => 'other',
        ];

        return DB::transaction(function () use ($batch, $quantity, $reason, $reasonMap, $userId) {
            $balance = $batch->current_quantity - $quantity;
            $batch->update(['current_quantity' => $balance]);

            InventoryAdjustment::create([
                'batch_id'    => $batch->id,
                'quantity'    => $quantity,
                'reason'      => $reasonMap[$reason] ?? 'other',
                'user_id'     => $userId,
                'occurred_at' => now(),
            ]);

            InventoryMovement::create([
                'batch_id'    => $batch->id,
                'type'        => 'adjustment',
                'quantity'    => -$quantity,
                'balance'     => $balance,
                'reason'      => $reason,
                'occurred_at' => now(),
            ]);

            return $batch;
        });
    }

    public function export(string $format, string $search = '', string $sortBy = 'expiration_date', string $sortDir = 'asc'): Response
    {
        $records = Batch::withTrashed()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Número de Lote'        => 'batch_number',
            'Fecha de Vencimiento'  => 'expiration_date',
            'Cantidad Actual'       => 'current_quantity',
            'Precio de Compra (Bs)' => 'purchase_price',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Lotes', 'columns' => $columns, 'records' => $records])->download('lotes.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'lotes.xlsx');
    }
}
