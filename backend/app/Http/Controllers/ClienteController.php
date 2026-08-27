<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $query = Cliente::query();

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('ci_nit', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        // Orden: solo columnas de la tabla (whitelist) para no exponer columnas internas.
        $sortBy = (string) $request->query('sort_by', 'nombre');
        $sortDir = strtolower((string) $request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        if (in_array($sortBy, ['nombre', 'ci_nit', 'telefono', 'direccion'], true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('nombre');
        }

        return response()->json($query->paginate(max(1, $request->integer('per_page', 10))));
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

    public function bulkDestroy(Request $request)
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ])['ids'];

        // "Consumidor Final" es protegido: se omite y el resto se elimina igual.
        $deleted = Cliente::whereIn('id_cliente', $ids)
            ->where('nombre', '!=', 'Consumidor Final')
            ->delete();

        return response()->json([
            'message' => "{$deleted} cliente(s) eliminado(s).",
            'deleted' => $deleted,
        ]);
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
