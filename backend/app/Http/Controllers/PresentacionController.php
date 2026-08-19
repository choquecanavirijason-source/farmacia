<?php

namespace App\Http\Controllers;

use App\Models\Medicamento;
use App\Models\Presentacion;
use Illuminate\Http\Request;

class PresentacionController extends Controller
{
    public function index()
    {
        return response()->json(Presentacion::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json(Presentacion::create($data), 201);
    }

    public function update(Request $request, Presentacion $presentacion)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ]);

        $presentacion->update($data);

        return response()->json($presentacion);
    }

    public function destroy(Presentacion $presentacion)
    {
        $enUso = Medicamento::where('id_presentacion', $presentacion->id_presentacion)->count();
        if ($enUso > 0) {
            return response()->json([
                'message' => "No se puede eliminar: {$enUso} medicamento(s) usan esta presentación.",
            ], 409);
        }

        $presentacion->delete();

        return response()->json(['message' => 'Presentación eliminada.']);
    }
}
