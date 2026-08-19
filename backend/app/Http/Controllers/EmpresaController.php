<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function show()
    {
        return response()->json($this->singleton());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'nit' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'logo' => ['nullable', 'string'],
        ]);

        $empresa = $this->singleton();
        $empresa->update([
            'nombre' => $data['nombre'],
            'nit' => $data['nit'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'logo_path' => $data['logo'] ?? null,
        ]);

        return response()->json($empresa);
    }

    /** Registro único: la tabla siempre tiene exactamente una fila (id_empresa=1). */
    private function singleton(): Empresa
    {
        return Empresa::firstOrCreate([], [
            'nombre' => 'Farmacia Juan de Dios',
            'direccion' => 'Potosí, Bolivia',
        ]);
    }
}
