<?php

namespace App\Http\Controllers;

use App\Models\Medicamento;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MedicamentoController extends Controller
{
    public function index()
    {
        return response()->json(Medicamento::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        return response()->json(Medicamento::create($data), 201);
    }

    public function update(Request $request, Medicamento $medicamento)
    {
        $data = $this->validated($request, $medicamento->id_medicamento);

        $medicamento->update($data);

        return response()->json($medicamento);
    }

    public function destroy(Medicamento $medicamento)
    {
        try {
            $medicamento->delete();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar: tiene lotes u operaciones asociadas.',
            ], 409);
        }

        return response()->json(['message' => 'Medicamento eliminado.']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'codigo' => [
                'required', 'string', 'max:30',
                Rule::unique('medicamentos', 'codigo')->ignore($ignoreId, 'id_medicamento'),
            ],
            'nombre' => ['required', 'string', 'max:150'],
            'concentracion' => ['nullable', 'string', 'max:60'],
            'precio_venta' => ['required', 'numeric', 'min:0'],
            'stock_minimo' => ['required', 'integer', 'min:0'],
            'requiere_receta' => ['required', 'boolean'],
            'estado' => ['required', Rule::in(['activo', 'inactivo'])],
            'id_categoria' => ['required', 'exists:categorias,id_categoria'],
            'id_presentacion' => ['required', 'exists:presentaciones,id_presentacion'],
            'id_laboratorio' => ['required', 'exists:laboratorios,id_laboratorio'],
        ]);
    }
}
