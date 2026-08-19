<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClienteController extends Controller
{
    public function index()
    {
        return response()->json(Cliente::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        return response()->json(Cliente::create($data), 201);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $data = $this->validated($request, $cliente->id_cliente);

        $cliente->update($data);

        return response()->json($cliente);
    }

    public function destroy(Cliente $cliente)
    {
        if ($cliente->nombre === 'Consumidor Final') {
            return response()->json([
                'message' => 'No se puede eliminar el cliente genérico "Consumidor Final".',
            ], 409);
        }

        $cliente->delete();

        return response()->json(['message' => 'Cliente eliminado.']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'ci_nit' => ['required', 'string', 'max:30', Rule::unique('clientes', 'ci_nit')->ignore($ignoreId, 'id_cliente')],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
