<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\InventoryMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class InventoryMovementService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'occurred_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return InventoryMovement::query()
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): InventoryMovement
    {
        return InventoryMovement::create($data);
    }

    public function update(InventoryMovement $movement, array $data): InventoryMovement
    {
        $movement->update($data);
        return $movement->refresh();
    }

    public function delete(int $id): void
    {
        InventoryMovement::findOrFail($id)->delete();
    }

    public function export(string $format): Response
    {
        $items = InventoryMovement::with('batch.medicament')->orderByDesc('occurred_at')->get();
        $columns = [
            'ID Movimiento' => 'id',
            'Lote'          => 'batch.batch_number',
            'Tipo'          => 'type',
            'Cantidad'      => 'quantity',
            'Saldo'         => 'balance',
            'Motivo'        => 'reason',
            'Fecha y Hora'  => 'occurred_at',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Movimientos de Inventario', 'columns' => $columns, 'records' => $items])->download('movimientos_inventario.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'movimientos_inventario.xlsx');
    }
}
