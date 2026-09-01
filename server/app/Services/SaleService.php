<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Batch;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\Invoice;
use App\Models\InventoryMovement;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SaleService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'sold_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return Sale::with(['client', 'invoice', 'payments.paymentMethod'])
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getById(int $id): Sale
    {
        return Sale::with(['client', 'invoice', 'payments.paymentMethod', 'details.medicament', 'details.batch'])
            ->findOrFail($id);
    }

    public function create(array $data, User $actor): array
    {
        $cashRegister = CashRegister::find($data['cash_register_id']);
        if (!$cashRegister || $cashRegister->status !== 'open') {
            throw new HttpException(409, 'La caja no está abierta.');
        }

        $paymentMethod = PaymentMethod::firstOrCreate(
            ['name' => $data['forma_pago']],
            ['status' => 'active']
        );

        $batchesByMedicament = [];
        $resolvedItems = [];
        $total = 0;

        foreach ($data['items'] as $item) {
            $medicamentId = $item['medicament_id'];
            if (!isset($batchesByMedicament[$medicamentId])) {
                $batchesByMedicament[$medicamentId] = Batch::where('medicament_id', $medicamentId)
                    ->orderBy('expiration_date')
                    ->get()
                    ->map(fn (Batch $b) => ['id' => $b->id, 'current_quantity' => $b->current_quantity])
                    ->all();
            }

            $selectedBatch = null;
            foreach ($batchesByMedicament[$medicamentId] as &$candidate) {
                if ($candidate['current_quantity'] >= $item['quantity']) {
                    $selectedBatch = &$candidate;
                    break;
                }
            }
            unset($candidate);

            if (!$selectedBatch) {
                throw ValidationException::withMessages([
                    'items' => ['No hay stock suficiente en un solo lote para uno de los productos. Reduce la cantidad.'],
                ]);
            }

            $selectedBatch['current_quantity'] -= $item['quantity'];
            $subtotal = $item['quantity'] * $item['unit_price'];
            $total += $subtotal;
            $resolvedItems[] = [
                'item'             => $item,
                'batch_id'         => $selectedBatch['id'],
                'subtotal'         => $subtotal,
                'discount_percent' => $item['discount_percent'] ?? 0,
            ];
        }

        $sale = DB::transaction(function () use ($resolvedItems, $total, $data, $actor, $paymentMethod) {
            $sale = Sale::create([
                'sold_at'          => now(),
                'total'            => $total,
                'status'           => 'active',
                'client_id'        => $data['client_id'] ?: null,
                'user_id'          => $actor->id,
                'cash_register_id' => $data['cash_register_id'],
            ]);

            foreach ($resolvedItems as $resolved) {
                $batch = Batch::find($resolved['batch_id']);
                $balance = $batch->current_quantity - $resolved['item']['quantity'];
                $batch->update(['current_quantity' => $balance]);

                InventoryMovement::create([
                    'batch_id'    => $batch->id,
                    'type'        => 'out',
                    'quantity'    => -$resolved['item']['quantity'],
                    'balance'     => $balance,
                    'reason'      => "Venta N° {$sale->id}",
                    'occurred_at' => now(),
                ]);

                SaleDetail::create([
                    'sale_id'          => $sale->id,
                    'medicament_id'    => $resolved['item']['medicament_id'],
                    'batch_id'         => $batch->id,
                    'quantity'         => $resolved['item']['quantity'],
                    'unit_price'       => $resolved['item']['unit_price'],
                    'discount_percent' => $resolved['discount_percent'],
                    'subtotal'         => $resolved['subtotal'],
                ]);
            }

            SalePayment::create([
                'sale_id'           => $sale->id,
                'payment_method_id' => $paymentMethod->id,
                'amount'            => $total,
            ]);

            Invoice::create([
                'sale_id'        => $sale->id,
                'invoice_number' => str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
                'client_tax_id'  => $data['nit_cliente'] ?: '0',
                'business_name'  => $data['razon_social'] ?: 'S/N',
                'issued_at'      => now(),
                'total'          => $total,
            ]);

            CashMovement::create([
                'cash_register_id' => $data['cash_register_id'],
                'type'             => 'income',
                'amount'           => $total,
                'description'      => "Venta N° {$sale->id}",
                'occurred_at'      => now(),
            ]);

            return $sale;
        });

        return array_merge(
            $sale->toArray(),
            ['forma_pago' => $paymentMethod->name]
        );
    }

    public function update(Sale $sale, array $data): Sale
    {
        $sale->update($data);
        return $sale->refresh();
    }

    public function delete(int $id): void
    {
        Sale::findOrFail($id)->delete();
    }

    public function getDetails(int $saleId): Collection
    {
        Sale::findOrFail($saleId);
        return SaleDetail::with(['medicament', 'batch'])->where('sale_id', $saleId)->orderBy('id')->get();
    }

    public function getInvoice(int $saleId): ?Invoice
    {
        Sale::findOrFail($saleId);
        return Invoice::where('sale_id', $saleId)->first();
    }

    public function void(int $id): array
    {
        $sale = Sale::findOrFail($id);
        if ($sale->status !== 'active') {
            throw new HttpException(409, 'Esta venta ya está anulada.');
        }

        $sale = DB::transaction(function () use ($sale) {
            $details = SaleDetail::where('sale_id', $sale->id)->get();

            foreach ($details as $detail) {
                $batch = Batch::find($detail->batch_id);
                $balance = $batch->current_quantity + $detail->quantity;
                $batch->update(['current_quantity' => $balance]);

                InventoryMovement::create([
                    'batch_id'    => $batch->id,
                    'type'        => 'in',
                    'quantity'    => $detail->quantity,
                    'balance'     => $balance,
                    'reason'      => "Anulación de venta N° {$sale->id}",
                    'occurred_at' => now(),
                ]);
            }

            $cashRegister = CashRegister::find($sale->cash_register_id);
            if ($cashRegister && $cashRegister->status === 'open') {
                CashMovement::create([
                    'cash_register_id' => $sale->cash_register_id,
                    'type'             => 'expense',
                    'amount'           => $sale->total,
                    'description'      => "Anulación de venta N° {$sale->id}",
                    'occurred_at'      => now(),
                ]);
            }

            $sale->update(['status' => 'voided']);

            return $sale;
        });

        $paymentMethodName = SalePayment::where('sale_id', $sale->id)
            ->join('payment_methods', 'payment_methods.id', '=', 'sale_payments.payment_method_id')
            ->value('payment_methods.name');

        return array_merge(
            $sale->toArray(),
            ['forma_pago' => $paymentMethodName]
        );
    }

    public function export(string $format): Response
    {
        $items = Sale::with(['client', 'user', 'cashRegister'])->orderByDesc('sold_at')->get();
        $columns = [
            'N° Venta'     => 'id',
            'Fecha y Hora' => 'sold_at',
            'Cliente'      => 'client.firstname',
            'Total (Bs)'   => 'total',
            'Estado'       => 'status',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Ventas', 'columns' => $columns, 'records' => $items])->download('ventas.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'ventas.xlsx');
    }
}
