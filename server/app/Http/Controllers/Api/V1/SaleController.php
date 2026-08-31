<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Sales\StoreSaleRequest;
use App\Http\Requests\Sales\UpdateSaleRequest;
use App\Http\Resources\Sales\SaleResource;
use App\Models\Batch;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\InventoryMovement;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class SaleController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $sales = Sale::query()->filter($request->only(['status', 'client_id']))->sort((string) $request->query('sort_by', 'sold_at'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(SaleResource::collection($sales), 'Ventas obtenidas con éxito.');
    }

    public function store(StoreSaleRequest $request)
    {
        $data = $request->validated();

        $caja = CashRegister::find($data['cash_register_id']);
        if (! $caja || $caja->status !== 'open') {
            return $this->errorResponse('La caja no está abierta.', 409);
        }

        $formaPago = PaymentMethod::firstOrCreate(
            ['name' => $data['forma_pago']],
            ['status' => 'active']
        );

        $lotesPorMedicamento = [];
        $resueltos = [];
        $total = 0;

        foreach ($data['items'] as $item) {
            $idMedicamento = $item['medicament_id'];
            if (! isset($lotesPorMedicamento[$idMedicamento])) {
                $lotesPorMedicamento[$idMedicamento] = Batch::where('medicament_id', $idMedicamento)
                    ->orderBy('expiration_date')
                    ->get()
                    ->map(fn (Batch $b) => ['id' => $b->id, 'current_quantity' => $b->current_quantity])
                    ->all();
            }

            $lote = null;
            foreach ($lotesPorMedicamento[$idMedicamento] as &$candidato) {
                if ($candidato['current_quantity'] >= $item['quantity']) {
                    $lote = &$candidato;
                    break;
                }
            }
            unset($candidato);

            if (! $lote) {
                throw ValidationException::withMessages([
                    'items' => ['No hay stock suficiente en un solo lote para uno de los productos. Reduce la cantidad.'],
                ]);
            }

            $lote['current_quantity'] -= $item['quantity'];
            $subtotal = $item['quantity'] * $item['unit_price'];
            $total += $subtotal;
            $resueltos[] = [
                'item' => $item,
                'batch_id' => $lote['id'],
                'subtotal' => $subtotal,
                'discount_percent' => $item['discount_percent'] ?? 0,
            ];
        }

        $actor = $request->user();

        $venta = DB::transaction(function () use ($resueltos, $total, $data, $actor, $formaPago) {
            $venta = Sale::create([
                'sold_at' => now(),
                'total' => $total,
                'status' => 'active',
                'client_id' => $data['client_id'] ?: null,
                'user_id' => $actor->id,
                'cash_register_id' => $data['cash_register_id'],
            ]);

            foreach ($resueltos as $r) {
                $lote = Batch::find($r['batch_id']);
                $saldo = $lote->current_quantity - $r['item']['quantity'];
                $lote->update(['current_quantity' => $saldo]);

                InventoryMovement::create([
                    'batch_id' => $lote->id,
                    'type' => 'out',
                    'quantity' => -$r['item']['quantity'],
                    'balance' => $saldo,
                    'reason' => "Venta N° {$venta->id}",
                    'occurred_at' => now(),
                ]);

                SaleDetail::create([
                    'sale_id' => $venta->id,
                    'medicament_id' => $r['item']['medicament_id'],
                    'batch_id' => $lote->id,
                    'quantity' => $r['item']['quantity'],
                    'unit_price' => $r['item']['unit_price'],
                    'discount_percent' => $r['discount_percent'],
                    'subtotal' => $r['subtotal'],
                ]);
            }

            SalePayment::create([
                'sale_id' => $venta->id,
                'payment_method_id' => $formaPago->id,
                'amount' => $total,
            ]);

            Invoice::create([
                'sale_id' => $venta->id,
                'invoice_number' => str_pad((string) $venta->id, 6, '0', STR_PAD_LEFT),
                'client_tax_id' => $data['nit_cliente'] ?: '0',
                'business_name' => $data['razon_social'] ?: 'S/N',
                'issued_at' => now(),
                'total' => $total,
            ]);

            CashMovement::create([
                'cash_register_id' => $data['cash_register_id'],
                'type' => 'income',
                'amount' => $total,
                'description' => "Venta N° {$venta->id}",
                'occurred_at' => now(),
            ]);

            return $venta;
        });

        return $this->createdResponse(array_merge(
            $venta->toArray(),
            ['forma_pago' => $formaPago->name]
        ), 'Venta registrada con éxito con factura y movimientos de caja/inventario.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new SaleResource(Sale::findOrFail($id)), 'Venta obtenida con éxito.');
    }

    public function update(UpdateSaleRequest $request, int $id)
    {
        $item = Sale::findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new SaleResource($item->refresh()), 'Venta actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        Sale::findOrFail($id)->delete();

        return $this->deletedResponse('Venta eliminada con éxito.');
    }

    public function details(int $id)
    {
        Sale::findOrFail($id);

        $details = SaleDetail::where('sale_id', $id)->orderBy('id')->get();

        return $this->successResponse($details, 'Detalle de la venta obtenido con éxito.');
    }

    public function invoice(int $id)
    {
        Sale::findOrFail($id);
        $factura = Invoice::where('sale_id', $id)->first();

        return $this->successResponse($factura, 'Factura de la venta obtenida con éxito.');
    }

    public function void(int $id)
    {
        $venta = Sale::findOrFail($id);
        if ($venta->status !== 'active') {
            return $this->errorResponse('Esta venta ya está anulada.', 409);
        }

        $venta = DB::transaction(function () use ($venta) {
            $detalles = SaleDetail::where('sale_id', $venta->id)->get();

            foreach ($detalles as $d) {
                $lote = Batch::find($d->batch_id);
                $saldo = $lote->current_quantity + $d->quantity;
                $lote->update(['current_quantity' => $saldo]);

                InventoryMovement::create([
                    'batch_id' => $lote->id,
                    'type' => 'in',
                    'quantity' => $d->quantity,
                    'balance' => $saldo,
                    'reason' => "Anulación de venta N° {$venta->id}",
                    'occurred_at' => now(),
                ]);
            }

            $caja = CashRegister::find($venta->cash_register_id);
            if ($caja && $caja->status === 'open') {
                CashMovement::create([
                    'cash_register_id' => $venta->cash_register_id,
                    'type' => 'expense',
                    'amount' => $venta->total,
                    'description' => "Anulación de venta N° {$venta->id}",
                    'occurred_at' => now(),
                ]);
            }

            $venta->update(['status' => 'voided']);

            return $venta;
        });

        return $this->successResponse(array_merge(
            $venta->toArray(),
            ['forma_pago' => SalePayment::where('sale_id', $venta->id)->join('payment_methods', 'payment_methods.id', '=', 'sale_payments.payment_method_id')->value('payment_methods.name')]
        ), 'Venta anulada con éxito y stock restaurado.');
    }

    public function export(Request $request)
    {
        $items = Sale::orderByDesc('sold_at')->get();
        $c = ['Sold at' => 'sold_at', 'Total' => 'total', 'Status' => 'status', 'Client' => 'client_id', 'User' => 'user_id', 'Cash register' => 'cash_register_id'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Sales', 'columns' => $c, 'records' => $items])->download('sales.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'sales.xlsx');
    }
}
