<?php

namespace App\Http\Controllers;

use App\Models\AjusteInventario;
use App\Models\Kardex;
use App\Models\Lote;
use App\Models\Medicamento;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LoteController extends Controller
{
    public function index()
    {
        return response()->json(Lote::orderBy('fecha_vencimiento')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'numero_lote' => ['required', 'string', 'max:60'],
            'fecha_vencimiento' => ['required', 'date'],
            'precio_compra' => ['required', 'numeric', 'min:0'],
            'id_medicamento' => ['required', 'exists:medicamentos,id_medicamento'],
            'cantidad_actual' => ['required', 'integer', 'min:1'],
        ]);

        $this->assertNumeroLoteUnico($data['id_medicamento'], $data['numero_lote']);

        $lote = DB::transaction(function () use ($data) {
            $lote = Lote::create($data);
            Kardex::create([
                'id_lote' => $lote->id_lote,
                'tipo' => 'entrada',
                'cantidad' => $data['cantidad_actual'],
                'saldo' => $data['cantidad_actual'],
                'motivo' => 'Registro inicial de lote',
                'fecha' => now(),
            ]);
            return $lote;
        });

        return response()->json($lote, 201);
    }

    public function update(Request $request, Lote $lote)
    {
        $data = $request->validate([
            'numero_lote' => ['required', 'string', 'max:60'],
            'fecha_vencimiento' => ['required', 'date'],
            'precio_compra' => ['required', 'numeric', 'min:0'],
            'id_medicamento' => ['required', 'exists:medicamentos,id_medicamento'],
        ]);

        $this->assertNumeroLoteUnico($data['id_medicamento'], $data['numero_lote'], $lote->id_lote);

        $lote->update($data);

        return response()->json($lote);
    }

    public function destroy(Lote $lote)
    {
        if ($lote->cantidad_actual > 0) {
            return response()->json([
                'message' => 'No se puede eliminar: el lote todavía tiene stock. Da de baja el stock primero.',
            ], 409);
        }

        try {
            $lote->delete();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar: el lote tiene movimientos de kardex/ajustes en su historial.',
            ], 409);
        }

        return response()->json(['message' => 'Lote eliminado.']);
    }

    public function darDeBaja(Request $request, Lote $lote)
    {
        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['required', Rule::in(['Vencimiento', 'Daño', 'Extravío', 'Otro'])],
        ]);

        if ($data['cantidad'] > $lote->cantidad_actual) {
            throw ValidationException::withMessages([
                'cantidad' => ["La cantidad debe estar entre 1 y {$lote->cantidad_actual}."],
            ]);
        }

        $actor = $request->user();

        $lote = DB::transaction(function () use ($lote, $data, $actor) {
            $saldo = $lote->cantidad_actual - $data['cantidad'];
            $lote->update(['cantidad_actual' => $saldo]);

            AjusteInventario::create([
                'id_lote' => $lote->id_lote,
                'cantidad' => $data['cantidad'],
                'motivo' => $data['motivo'],
                'id_usuario' => $actor->id_usuario,
                'fecha' => now(),
            ]);

            Kardex::create([
                'id_lote' => $lote->id_lote,
                'tipo' => 'ajuste',
                'cantidad' => -$data['cantidad'],
                'saldo' => $saldo,
                'motivo' => $data['motivo'],
                'fecha' => now(),
            ]);

            return $lote;
        });

        return response()->json($lote);
    }

    public function vender(Request $request, Lote $lote)
    {
        return response()->json($this->moverStock($lote, $request, tipo: 'salida', signo: -1));
    }

    public function restaurar(Request $request, Lote $lote)
    {
        return response()->json($this->moverStock($lote, $request, tipo: 'entrada', signo: 1));
    }

    private function moverStock(Lote $lote, Request $request, string $tipo, int $signo): Lote
    {
        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['required', 'string', 'max:150'],
        ]);

        if ($tipo === 'salida' && $data['cantidad'] > $lote->cantidad_actual) {
            throw ValidationException::withMessages([
                'cantidad' => ["Stock insuficiente en el lote {$lote->numero_lote}."],
            ]);
        }

        return DB::transaction(function () use ($lote, $data, $tipo, $signo) {
            $saldo = $lote->cantidad_actual + ($signo * $data['cantidad']);
            $lote->update(['cantidad_actual' => $saldo]);

            Kardex::create([
                'id_lote' => $lote->id_lote,
                'tipo' => $tipo,
                'cantidad' => $signo * $data['cantidad'],
                'saldo' => $saldo,
                'motivo' => $data['motivo'],
                'fecha' => now(),
            ]);

            return $lote;
        });
    }

    public function kardex(Lote $lote)
    {
        return response()->json(
            Kardex::where('id_lote', $lote->id_lote)->orderByDesc('fecha')->get()
        );
    }

    public function kardexPorMedicamento(Medicamento $medicamento)
    {
        $data = Kardex::query()
            ->join('lotes', 'lotes.id_lote', '=', 'kardex.id_lote')
            ->where('lotes.id_medicamento', $medicamento->id_medicamento)
            ->orderByDesc('kardex.fecha')
            ->select('kardex.*', 'lotes.numero_lote')
            ->get();

        return response()->json($data);
    }

    private function assertNumeroLoteUnico(int $idMedicamento, string $numeroLote, ?int $ignoreId = null): void
    {
        $exists = Lote::where('id_medicamento', $idMedicamento)
            ->whereRaw('LOWER(numero_lote) = ?', [strtolower($numeroLote)])
            ->when($ignoreId, fn ($q) => $q->where('id_lote', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'numero_lote' => ["Este medicamento ya tiene un lote con número \"{$numeroLote}\"."],
            ]);
        }
    }
}
