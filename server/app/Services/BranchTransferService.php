<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Batch;
use App\Models\BranchTransfer;
use App\Models\InventoryMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class BranchTransferService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'created_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return BranchTransfer::with(['medicament', 'fromBranch', 'toBranch'])
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    /** Traspasa stock de un lote de una sucursal a otra en una sola transacción atómica.
     * Solo se puede traspasar stock de la sucursal en la que el usuario está activo actualmente
     * (evita que alguien despache stock de una sucursal donde no está presente). */
    public function transfer(int $batchId, int $toBranchId, int $quantity, ?string $reason, int $userId, int $userBranchId): BranchTransfer
    {
        $sourceBatch = Batch::findOrFail($batchId);

        if ((int) $sourceBatch->branch_id !== $userBranchId) {
            throw ValidationException::withMessages([
                'batch_id' => ['Solo puedes traspasar stock de tu sucursal activa.'],
            ]);
        }

        if ((int) $sourceBatch->branch_id === $toBranchId) {
            throw ValidationException::withMessages([
                'to_branch_id' => ['La sucursal de destino debe ser diferente a la de origen.'],
            ]);
        }

        if ($quantity < 1 || $quantity > $sourceBatch->current_quantity) {
            throw ValidationException::withMessages([
                'quantity' => ["La cantidad debe estar entre 1 y {$sourceBatch->current_quantity}."],
            ]);
        }

        return DB::transaction(function () use ($sourceBatch, $toBranchId, $quantity, $reason, $userId) {
            $fromBranchId = (int) $sourceBatch->branch_id;

            $newSourceQty = $sourceBatch->current_quantity - $quantity;
            $sourceBatch->update(['current_quantity' => $newSourceQty]);

            InventoryMovement::create([
                'batch_id'    => $sourceBatch->id,
                'type'        => 'out',
                'quantity'    => -$quantity,
                'balance'     => $newSourceQty,
                'reason'      => "Traspaso de sucursal (lote {$sourceBatch->batch_number})",
                'occurred_at' => now(),
            ]);

            $destinationBatch = Batch::where('branch_id', $toBranchId)
                ->where('medicament_id', $sourceBatch->medicament_id)
                ->whereRaw('LOWER(batch_number) = ?', [strtolower($sourceBatch->batch_number)])
                ->first();

            if ($destinationBatch) {
                $newDestQty = $destinationBatch->current_quantity + $quantity;
                $destinationBatch->update(['current_quantity' => $newDestQty]);
            } else {
                $destinationBatch = Batch::create([
                    'batch_number'      => $sourceBatch->batch_number,
                    'expiration_date'   => $sourceBatch->expiration_date,
                    'purchase_price'    => $sourceBatch->purchase_price,
                    'medicament_id'     => $sourceBatch->medicament_id,
                    'branch_id'         => $toBranchId,
                    'current_quantity'  => $quantity,
                ]);
                $newDestQty = $quantity;
            }

            InventoryMovement::create([
                'batch_id'    => $destinationBatch->id,
                'type'        => 'in',
                'quantity'    => $quantity,
                'balance'     => $newDestQty,
                'reason'      => "Traspaso de sucursal (lote {$sourceBatch->batch_number})",
                'occurred_at' => now(),
            ]);

            $transfer = BranchTransfer::create([
                'medicament_id'         => $sourceBatch->medicament_id,
                'from_branch_id'        => $fromBranchId,
                'to_branch_id'          => $toBranchId,
                'source_batch_id'       => $sourceBatch->id,
                'destination_batch_id'  => $destinationBatch->id,
                'quantity'              => $quantity,
                'reason'                => $reason,
                'created_id'            => $userId,
            ]);

            return $transfer->load(['medicament', 'fromBranch', 'toBranch', 'sourceBatch', 'destinationBatch']);
        });
    }

    public function export(string $format, array $filters = [], string $sortBy = 'created_at', string $sortDir = 'desc'): Response
    {
        $records = BranchTransfer::with(['medicament', 'fromBranch', 'toBranch'])
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->get()
            ->map(fn ($t) => [
                'medicamento'      => $t->medicament?->name,
                'sucursal_origen'  => $t->fromBranch?->name,
                'sucursal_destino' => $t->toBranch?->name,
                'cantidad'         => $t->quantity,
                'motivo'           => $t->reason,
                'fecha'            => $t->created_at?->format('Y-m-d H:i'),
            ]);

        $columns = [
            'Medicamento'       => 'medicamento',
            'Sucursal Origen'   => 'sucursal_origen',
            'Sucursal Destino'  => 'sucursal_destino',
            'Cantidad'          => 'cantidad',
            'Motivo'            => 'motivo',
            'Fecha'             => 'fecha',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Traspasos entre Sucursales', 'columns' => $columns, 'records' => $records])->download('traspasos.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'traspasos.xlsx');
    }
}
