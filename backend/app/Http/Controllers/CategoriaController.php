<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Medicamento;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index()
    {
        return response()->json(Categoria::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json(Categoria::create($data), 201);
    }

    public function update(Request $request, Categoria $categoria)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ]);

        $categoria->update($data);

        return response()->json($categoria);
    }

    public function destroy(Categoria $categoria)
    {
        $enUso = Medicamento::where('id_categoria', $categoria->id_categoria)->count();
        if ($enUso > 0) {
            return response()->json([
                'message' => "No se puede eliminar: {$enUso} medicamento(s) usan esta categoría.",
            ], 409);
        }

        $categoria->delete();

        return response()->json(['message' => 'Categoría eliminada.']);
    }
}
