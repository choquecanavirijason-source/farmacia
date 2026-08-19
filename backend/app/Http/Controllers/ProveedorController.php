<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProveedorController extends Controller
{
    public function index()
    {
        return response()->json(Proveedor::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        return response()->json(Proveedor::create($data), 201);
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $data = $this->validated($request, $proveedor->id_proveedor);

        $proveedor->update($data);

        return response()->json($proveedor);
    }

    public function destroy(Proveedor $proveedor)
    {
        try {
            $proveedor->delete();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar: tiene compras registradas.',
            ], 409);
        }

        return response()->json(['message' => 'Proveedor eliminado.']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'nit' => ['required', 'string', 'max:30', Rule::unique('proveedores', 'nit')->ignore($ignoreId, 'id_proveedor')],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);
    }
}
