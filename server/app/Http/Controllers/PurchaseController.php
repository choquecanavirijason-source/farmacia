<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Http\Requests\Purchases\UpdatePurchaseRequest;
use App\Http\Resources\Purchases\PurchaseResource;
use App\Models\Batch;
use App\Models\InventoryMovement;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        return PurchaseResource::collection(Purchase::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'purchase_date'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    /**
     * Crea la Compra y, por cada línea, un Lote nuevo (con su kardex de
     * entrada) más su DetalleCompra. Todo en una transacción: si una línea
     * falla, no queda un lote huérfano sin la compra que lo explica.
     */
    public function store(StorePurchaseRequest $request)
    {
        $data = $request->validated();

        $facturaExiste = Purchase::where('supplier_id', $data['supplier_id'])
            ->whereRaw('LOWER(invoice_number) = ?', [strtolower($data['invoice_number'])])
            ->exists();
        if ($facturaExiste) {
            throw ValidationException::withMessages([
                'invoice_number' => ["Ya registraste la factura \"{$data['invoice_number']}\" para este proveedor."],
            ]);
        }

        $vistos = [];
        foreach ($data['items'] as $item) {
            $clave = $item['medicament_id'].':'.strtolower($item['batch_number']);
            if (isset($vistos[$clave])) {
                throw ValidationException::withMessages([
                    'items' => ["El N° de lote \"{$item['batch_number']}\" está repetido en esta compra."],
                ]);
            }
            $vistos[$clave] = true;

            $yaExiste = Batch::where('medicament_id', $item['medicament_id'])
                ->whereRaw('LOWER(batch_number) = ?', [strtolower($item['batch_number'])])
                ->exists();
            if ($yaExiste) {
                throw ValidationException::withMessages([
                    'items' => ["Este medicamento ya tiene un lote con número \"{$item['batch_number']}\"."],
                ]);
            }
        }

        $compra = DB::transaction(function () use ($data) {
            $total = 0;
            foreach ($data['items'] as $item) {
                $total += $item['quantity'] * $item['unit_price'];
            }

            $compra = Purchase::create([
                'supplier_id' => $data['supplier_id'],
                'invoice_number' => $data['invoice_number'],
                'purchase_date' => $data['purchase_date'],
                'total' => $total,
            ]);

            foreach ($data['items'] as $item) {
                $lote = Batch::create([
                    'batch_number' => $item['batch_number'],
                    'expiration_date' => $item['expiration_date'],
                    'purchase_price' => $item['unit_price'],
                    'medicament_id' => $item['medicament_id'],
                    'current_quantity' => $item['quantity'],
                ]);

                InventoryMovement::create([
                    'batch_id' => $lote->id,
                    'type' => 'in',
                    'quantity' => $item['quantity'],
                    'balance' => $item['quantity'],
                    'reason' => "Compra N° {$data['invoice_number']}",
                    'occurred_at' => now(),
                ]);

                PurchaseDetail::create([
                    'purchase_id' => $compra->id,
                    'medicament_id' => $item['medicament_id'],
                    'batch_id' => $lote->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $compra;
        });

        return response()->json($compra, 201);
    }

    public function show(int $id)
    {
        return new PurchaseResource(Purchase::findOrFail($id));
    }

    public function update(UpdatePurchaseRequest $request, int $id)
    {
        $item = Purchase::findOrFail($id);
        $item->update($request->validated());

        return new PurchaseResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Purchase::findOrFail($id)->delete();

        return response()->json(['message' => 'Purchase deleted.']);
    }

    /** Líneas de una compra: cada una con su lote creado, cantidades y subtotales. */
    public function details(int $id)
    {
        Purchase::findOrFail($id);

        return response()->json(
            PurchaseDetail::where('purchase_id', $id)->orderBy('id')->get()
        );
    }

    public function export(Request $request)
    {
        $items = Purchase::orderByDesc('purchase_date')->get();
        $c = ['Invoice number' => 'invoice_number', 'Purchase date' => 'purchase_date', 'Total' => 'total', 'Supplier' => 'supplier_id'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Purchases', 'columns' => $c, 'records' => $items])->download('purchases.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'purchases.xlsx');
    }
}
