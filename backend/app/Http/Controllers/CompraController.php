<?php

namespace App\Http\Controllers;

use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Kardex;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompraController extends Controller
{
    public function index()
    {
        return response()->json(Compra::orderByDesc('fecha')->get());
    }

    public function detalles(Compra $compra)
    {
        return response()->json(
            DetalleCompra::where('id_compra', $compra->id_compra)->get()
        );
    }

    /**
     * Crea la Compra y, por cada línea, un Lote nuevo (con su entrada de kardex)
     * más su DetalleCompra. Todo en una transacción: si una línea falla, no
     * queda ningún lote huérfano sin la Compra que lo explica.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'id_proveedor' => ['required', 'exists:proveedores,id_proveedor'],
            'numero_factura' => ['required', 'string', 'max:60'],
            'fecha' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_medicamento' => ['required', 'exists:medicamentos,id_medicamento'],
            'items.*.numero_lote' => ['required', 'string', 'max:60'],
            'items.*.fecha_vencimiento' => ['required', 'date'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);

        $facturaExiste = Compra::where('id_proveedor', $data['id_proveedor'])
            ->whereRaw('LOWER(numero_factura) = ?', [strtolower($data['numero_factura'])])
            ->exists();
        if ($facturaExiste) {
            throw ValidationException::withMessages([
                'numero_factura' => ["Ya registraste la factura \"{$data['numero_factura']}\" para este proveedor."],
            ]);
        }

        $vistos = [];
        foreach ($data['items'] as $item) {
            $clave = $item['id_medicamento'].':'.strtolower($item['numero_lote']);
            if (isset($vistos[$clave])) {
                throw ValidationException::withMessages([
                    'items' => ["El N° de lote \"{$item['numero_lote']}\" está repetido en esta compra."],
                ]);
            }
            $vistos[$clave] = true;

            $yaExiste = Lote::where('id_medicamento', $item['id_medicamento'])
                ->whereRaw('LOWER(numero_lote) = ?', [strtolower($item['numero_lote'])])
                ->exists();
            if ($yaExiste) {
                throw ValidationException::withMessages([
                    'items' => ["Este medicamento ya tiene un lote con número \"{$item['numero_lote']}\"."],
                ]);
            }
        }

        $compra = DB::transaction(function () use ($data) {
            $total = 0;
            foreach ($data['items'] as $item) {
                $total += $item['cantidad'] * $item['precio_unitario'];
            }

            $compra = Compra::create([
                'id_proveedor' => $data['id_proveedor'],
                'numero_factura' => $data['numero_factura'],
                'fecha' => $data['fecha'],
                'total' => $total,
            ]);

            foreach ($data['items'] as $item) {
                $lote = Lote::create([
                    'numero_lote' => $item['numero_lote'],
                    'fecha_vencimiento' => $item['fecha_vencimiento'],
                    'precio_compra' => $item['precio_unitario'],
                    'id_medicamento' => $item['id_medicamento'],
                    'cantidad_actual' => $item['cantidad'],
                ]);

                Kardex::create([
                    'id_lote' => $lote->id_lote,
                    'tipo' => 'entrada',
                    'cantidad' => $item['cantidad'],
                    'saldo' => $item['cantidad'],
                    'motivo' => "Compra Nº {$data['numero_factura']}",
                    'fecha' => now(),
                ]);

                DetalleCompra::create([
                    'id_compra' => $compra->id_compra,
                    'id_medicamento' => $item['id_medicamento'],
                    'id_lote' => $lote->id_lote,
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $item['cantidad'] * $item['precio_unitario'],
                ]);
            }

            return $compra;
        });

        return response()->json($compra, 201);
    }
}
