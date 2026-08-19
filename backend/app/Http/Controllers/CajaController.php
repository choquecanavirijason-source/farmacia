<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\MovimientoCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CajaController extends Controller
{
    public function index()
    {
        return response()->json(Caja::orderByDesc('fecha_apertura')->get());
    }

    public function abierta()
    {
        // response()->json(null) no sirve: Symfony's JsonResponse reemplaza null por
        // un ArrayObject vacío y devuelve "{}" en vez de "null" — se arma la respuesta a mano.
        $caja = Caja::where('estado', 'abierta')->first();

        return response(json_encode($caja), 200, ['Content-Type' => 'application/json']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'monto_apertura' => ['required', 'numeric', 'min:0'],
        ]);

        if (Caja::where('estado', 'abierta')->exists()) {
            return response()->json(['message' => 'Ya hay una caja abierta.'], 409);
        }

        $caja = Caja::create([
            'fecha_apertura' => now(),
            'monto_apertura' => $data['monto_apertura'],
            'estado' => 'abierta',
        ]);

        return response()->json($caja, 201);
    }

    public function movimientos(Caja $caja)
    {
        return response()->json(
            MovimientoCaja::where('id_caja', $caja->id_caja)->orderByDesc('fecha')->get()
        );
    }

    public function registrarMovimiento(Request $request, Caja $caja)
    {
        $data = $request->validate([
            'tipo' => ['required', Rule::in(['ingreso', 'egreso'])],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'concepto' => ['required', 'string', 'max:150'],
        ]);

        if ($caja->estado !== 'abierta') {
            return response()->json(['message' => 'La caja no está abierta.'], 409);
        }

        $movimiento = MovimientoCaja::create([
            'id_caja' => $caja->id_caja,
            'tipo' => $data['tipo'],
            'monto' => $data['monto'],
            'concepto' => trim($data['concepto']),
            'fecha' => now(),
        ]);

        return response()->json($movimiento, 201);
    }

    public function cerrar(Request $request, Caja $caja)
    {
        $data = $request->validate([
            'monto_cierre' => ['required', 'numeric', 'min:0'],
        ]);

        if ($caja->estado !== 'abierta') {
            return response()->json(['message' => 'La caja no está abierta.'], 409);
        }

        $caja = DB::transaction(function () use ($caja, $data) {
            $esperado = (float) $caja->monto_apertura
                + (float) MovimientoCaja::where('id_caja', $caja->id_caja)->where('tipo', 'ingreso')->sum('monto')
                - (float) MovimientoCaja::where('id_caja', $caja->id_caja)->where('tipo', 'egreso')->sum('monto');

            $caja->update([
                'fecha_cierre' => now(),
                'monto_cierre' => $data['monto_cierre'],
                'monto_esperado_cierre' => $esperado,
                'estado' => 'cerrada',
            ]);

            return $caja;
        });

        return response()->json([
            'caja' => $caja,
            'esperado' => (float) $caja->monto_esperado_cierre,
            'diferencia' => $data['monto_cierre'] - (float) $caja->monto_esperado_cierre,
        ]);
    }
}
