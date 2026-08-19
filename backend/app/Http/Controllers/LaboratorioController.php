<?php

namespace App\Http\Controllers;

use App\Models\Laboratorio;
use App\Models\Medicamento;
use Illuminate\Http\Request;

class LaboratorioController extends Controller
{
    public function index()
    {
        return response()->json(Laboratorio::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'pais' => ['nullable', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:30'],
        ]);

        return response()->json(Laboratorio::create($data), 201);
    }

    public function update(Request $request, Laboratorio $laboratorio)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'pais' => ['nullable', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:30'],
        ]);

        $laboratorio->update($data);

        return response()->json($laboratorio);
    }

    public function destroy(Laboratorio $laboratorio)
    {
        $enUso = Medicamento::where('id_laboratorio', $laboratorio->id_laboratorio)->count();
        if ($enUso > 0) {
            return response()->json([
                'message' => "No se puede eliminar: {$enUso} medicamento(s) usan este laboratorio.",
            ], 409);
        }

        $laboratorio->delete();

        return response()->json(['message' => 'Laboratorio eliminado.']);
    }
}
