<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Batch;
use App\Models\InventoryMovement;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class PurchaseService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'purchase_date', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return Purchase::with(['supplier', 'details.medicament'])
            ->when(!empty($filters['search']), fn ($q) => $q->search((string) $filters['search']))
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getById(int $id): Purchase
    {
        return Purchase::with(['supplier', 'details.medicament', 'details.batch'])->findOrFail($id);
    }

    public function create(array $data): Purchase
    {
        $invoiceExists = Purchase::where('supplier_id', $data['supplier_id'])
            ->whereRaw('LOWER(invoice_number) = ?', [strtolower($data['invoice_number'])])
            ->exists();

        if ($invoiceExists) {
            throw ValidationException::withMessages([
                'invoice_number' => ["Ya registraste la factura \"{$data['invoice_number']}\" para este proveedor."],
            ]);
        }

        $seenKeys = [];
        foreach ($data['items'] as $item) {
            $key = $item['medicament_id'] . ':' . strtolower($item['batch_number']);
            if (isset($seenKeys[$key])) {
                throw ValidationException::withMessages([
                    'items' => ["El N° de lote \"{$item['batch_number']}\" está repetido en esta compra."],
                ]);
            }
            $seenKeys[$key] = true;

            $batchExists = Batch::where('medicament_id', $item['medicament_id'])
                ->whereRaw('LOWER(batch_number) = ?', [strtolower($item['batch_number'])])
                ->exists();

            if ($batchExists) {
                throw ValidationException::withMessages([
                    'items' => ["Este medicamento ya tiene un lote con número \"{$item['batch_number']}\"."],
                ]);
            }
        }

        return DB::transaction(function () use ($data) {
            $total = 0;
            foreach ($data['items'] as $item) {
                $total += $item['quantity'] * $item['unit_price'];
            }

            $purchase = Purchase::create([
                'supplier_id'    => $data['supplier_id'],
                'invoice_number' => $data['invoice_number'],
                'purchase_date'  => $data['purchase_date'],
                'total'          => $total,
            ]);

            foreach ($data['items'] as $item) {
                $batch = Batch::create([
                    'batch_number'     => $item['batch_number'],
                    'expiration_date'  => $item['expiration_date'],
                    'purchase_price'   => $item['unit_price'],
                    'medicament_id'    => $item['medicament_id'],
                    'current_quantity' => $item['quantity'],
                ]);

                InventoryMovement::create([
                    'batch_id'    => $batch->id,
                    'type'        => 'in',
                    'quantity'    => $item['quantity'],
                    'balance'     => $item['quantity'],
                    'reason'      => "Compra N° {$data['invoice_number']}",
                    'occurred_at' => now(),
                ]);

                PurchaseDetail::create([
                    'purchase_id'   => $purchase->id,
                    'medicament_id' => $item['medicament_id'],
                    'batch_id'      => $batch->id,
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $item['unit_price'],
                    'subtotal'      => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $purchase;
        });
    }

    public function update(Purchase $purchase, array $data): Purchase
    {
        $purchase->update($data);
        return $purchase->refresh();
    }

    public function delete(int $id): void
    {
        Purchase::findOrFail($id)->delete();
    }

    public function getDetails(int $purchaseId): Collection
    {
        Purchase::findOrFail($purchaseId);
        return PurchaseDetail::with(['medicament', 'batch'])->where('purchase_id', $purchaseId)->orderBy('id')->get();
    }

    public function export(string $format): Response
    {
        $items = Purchase::with(['supplier'])->orderByDesc('purchase_date')->get();
        $columns = [
            'N° Factura'      => 'invoice_number',
            'Proveedor'       => 'supplier.name',
            'Fecha de Compra' => 'purchase_date',
            'Total (Bs)'      => 'total',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Compras', 'columns' => $columns, 'records' => $items])->download('compras.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'compras.xlsx');
    }
}
