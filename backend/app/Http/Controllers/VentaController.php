<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\DetalleVenta;
use App\Models\Factura;
use App\Models\FormaPago;
use App\Models\Kardex;
use App\Models\Lote;
use App\Models\MovimientoCaja;
use App\Models\PagoVenta;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VentaController extends Controller
{
    public function index()
    {
        return response()->json(
            Venta::orderByDesc('fecha')->get()->map(fn (Venta $v) => $this->conFormaPago($v))
        );
    }

    public function detalles(Venta $venta)
    {
        return response()->json(DetalleVenta::where('id_venta', $venta->id_venta)->get());
    }

    public function factura(Venta $venta)
    {
        // response()->json(null) no sirve: Symfony devuelve "{}" en vez de "null" — se arma a mano.
        $factura = Factura::where('id_venta', $venta->id_venta)->first();

        return response(json_encode($factura), 200, ['Content-Type' => 'application/json']);
    }

    /**
     * Registra la venta: por cada línea busca el lote FEFO (vencimiento más
     * próximo) con stock suficiente y descuenta de ahí — no reparte una línea
     * entre varios lotes. Genera el kardex de salida, la factura correlativa,
     * el pago y el ingreso en caja. Todo en una transacción: primero se
     * resuelve el lote de CADA línea contra una copia en memoria del stock
     * (sin escribir nada); solo si todas tienen lote válido se descuenta de
     * verdad — igual que Compras, para no dejar stock descontado sin venta.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'id_cliente' => ['required', 'exists:clientes,id_cliente'],
            'id_caja' => ['required', 'exists:cajas,id_caja'],
            'forma_pago' => ['required', 'string', 'exists:formas_pago,nombre'],
            'nit_cliente' => ['nullable', 'string', 'max:30'],
            'razon_social' => ['nullable', 'string', 'max:150'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_medicamento' => ['required', 'exists:medicamentos,id_medicamento'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);

        $actor = $request->user();

        $caja = Caja::find($data['id_caja']);
        if (! $caja || $caja->estado !== 'abierta') {
            return response()->json(['message' => 'La caja no está abierta.'], 409);
        }

        // Paso 1: resolver el lote FEFO de cada línea contra una copia en memoria (sin tocar la BD).
        $lotesPorMedicamento = [];
        $resueltos = [];
        $total = 0;

        foreach ($data['items'] as $item) {
            $idMed = $item['id_medicamento'];
            if (! isset($lotesPorMedicamento[$idMed])) {
                $lotesPorMedicamento[$idMed] = Lote::where('id_medicamento', $idMed)
                    ->orderBy('fecha_vencimiento')
                    ->get()
                    ->map(fn (Lote $l) => ['id_lote' => $l->id_lote, 'cantidad_actual' => $l->cantidad_actual])
                    ->all();
            }

            $lote = null;
            foreach ($lotesPorMedicamento[$idMed] as &$candidato) {
                if ($candidato['cantidad_actual'] >= $item['cantidad']) {
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

            $lote['cantidad_actual'] -= $item['cantidad'];
            $subtotal = $item['cantidad'] * $item['precio_unitario'];
            $total += $subtotal;
            $resueltos[] = ['item' => $item, 'id_lote' => $lote['id_lote'], 'subtotal' => $subtotal];
        }

        $idFormaPago = FormaPago::where('nombre', $data['forma_pago'])->value('id_forma_pago');

        $venta = DB::transaction(function () use ($resueltos, $total, $data, $actor, $idFormaPago) {
            $venta = Venta::create([
                'fecha' => now(),
                'total' => $total,
                'estado' => 'activa',
                'id_cliente' => $data['id_cliente'],
                'id_usuario' => $actor->id_usuario,
                'id_caja' => $data['id_caja'],
            ]);

            foreach ($resueltos as $r) {
                $lote = Lote::find($r['id_lote']);
                $saldo = $lote->cantidad_actual - $r['item']['cantidad'];
                $lote->update(['cantidad_actual' => $saldo]);

                Kardex::create([
                    'id_lote' => $lote->id_lote,
                    'tipo' => 'salida',
                    'cantidad' => -$r['item']['cantidad'],
                    'saldo' => $saldo,
                    'motivo' => "Venta Nº {$venta->id_venta}",
                    'fecha' => now(),
                ]);

                DetalleVenta::create([
                    'id_venta' => $venta->id_venta,
                    'id_medicamento' => $r['item']['id_medicamento'],
                    'id_lote' => $lote->id_lote,
                    'cantidad' => $r['item']['cantidad'],
                    'precio_unitario' => $r['item']['precio_unitario'],
                    'subtotal' => $r['subtotal'],
                ]);
            }

            PagoVenta::create([
                'id_venta' => $venta->id_venta,
                'id_forma_pago' => $idFormaPago,
                'monto' => $total,
            ]);

            $numeroFactura = str_pad((string) (Factura::count() + 1), 6, '0', STR_PAD_LEFT);
            Factura::create([
                'id_venta' => $venta->id_venta,
                'numero_factura' => $numeroFactura,
                'nit_cliente' => $data['nit_cliente'] ?: '0',
                'razon_social' => $data['razon_social'] ?: 'S/N',
                'fecha_emision' => $venta->fecha,
                'total' => $total,
            ]);

            MovimientoCaja::create([
                'id_caja' => $data['id_caja'],
                'tipo' => 'ingreso',
                'monto' => $total,
                'concepto' => "Venta Nº {$venta->id_venta}",
                'fecha' => now(),
            ]);

            return $venta;
        });

        return response()->json($this->conFormaPago($venta), 201);
    }

    /**
     * Anula la venta: devuelve el stock a cada lote (con su kardex de
     * entrada) y compensa el ingreso en caja solo si esa caja sigue abierta
     * — si ya se cerró, el historial de esa caja queda intacto (igual que
     * Compras), y la anulación queda documentada solo en la venta.
     */
    public function anular(Venta $venta)
    {
        if ($venta->estado !== 'activa') {
            return response()->json(['message' => 'Esta venta ya está anulada.'], 409);
        }

        $venta = DB::transaction(function () use ($venta) {
            $detalles = DetalleVenta::where('id_venta', $venta->id_venta)->get();

            foreach ($detalles as $d) {
                $lote = Lote::find($d->id_lote);
                $saldo = $lote->cantidad_actual + $d->cantidad;
                $lote->update(['cantidad_actual' => $saldo]);

                Kardex::create([
                    'id_lote' => $lote->id_lote,
                    'tipo' => 'entrada',
                    'cantidad' => $d->cantidad,
                    'saldo' => $saldo,
                    'motivo' => "Anulación de venta Nº {$venta->id_venta}",
                    'fecha' => now(),
                ]);
            }

            $caja = Caja::find($venta->id_caja);
            if ($caja && $caja->estado === 'abierta') {
                MovimientoCaja::create([
                    'id_caja' => $venta->id_caja,
                    'tipo' => 'egreso',
                    'monto' => $venta->total,
                    'concepto' => "Anulación de venta Nº {$venta->id_venta}",
                    'fecha' => now(),
                ]);
            }

            $venta->update(['estado' => 'anulada']);

            return $venta;
        });

        return response()->json($this->conFormaPago($venta));
    }

    private function conFormaPago(Venta $venta): array
    {
        $formaPago = PagoVenta::where('id_venta', $venta->id_venta)
            ->join('formas_pago', 'formas_pago.id_forma_pago', '=', 'pagos_venta.id_forma_pago')
            ->value('formas_pago.nombre');

        return array_merge($venta->toArray(), ['forma_pago' => $formaPago]);
    }
}
