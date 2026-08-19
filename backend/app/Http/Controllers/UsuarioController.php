<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index()
    {
        return response()->json(Usuario::with('rol')->orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'usuario' => ['required', 'string', 'max:60', 'unique:usuarios,usuario'],
            'contrasena' => ['required', 'string', 'min:6'],
            'estado' => ['required', Rule::in(['activo', 'inactivo'])],
            'id_rol' => ['required', 'exists:roles,id_rol'],
        ]);

        $usuario = Usuario::create([
            'nombre' => $data['nombre'],
            'usuario' => $data['usuario'],
            'contrasena' => Hash::make($data['contrasena']),
            'estado' => $data['estado'],
            'fecha_registro' => now(),
            'id_rol' => $data['id_rol'],
        ]);

        return response()->json($usuario->load('rol'), 201);
    }

    public function update(Request $request, Usuario $usuario)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'usuario' => ['required', 'string', 'max:60', Rule::unique('usuarios', 'usuario')->ignore($usuario->id_usuario, 'id_usuario')],
            'contrasena' => ['nullable', 'string', 'min:6'],
            'estado' => ['required', Rule::in(['activo', 'inactivo'])],
            'id_rol' => ['required', 'exists:roles,id_rol'],
        ]);

        $actor = $request->user();
        $nuevoRol = Rol::findOrFail($data['id_rol']);
        $dejaDeSerAdmin = $usuario->rol->nombre === 'ADMINISTRADOR'
            && ($nuevoRol->nombre !== 'ADMINISTRADOR' || $data['estado'] !== 'activo');

        if ($actor->id_usuario === $usuario->id_usuario && $dejaDeSerAdmin) {
            return response()->json(['message' => 'No puede quitarse a sí mismo el rol de administrador.'], 409);
        }

        if ($dejaDeSerAdmin && $this->esUltimoAdminActivo($usuario)) {
            return response()->json(['message' => 'Debe existir al menos un administrador activo.'], 409);
        }

        $usuario->nombre = $data['nombre'];
        $usuario->usuario = $data['usuario'];
        $usuario->estado = $data['estado'];
        $usuario->id_rol = $data['id_rol'];

        if (! empty($data['contrasena'])) {
            $usuario->contrasena = Hash::make($data['contrasena']);
        }

        $usuario->save();

        return response()->json($usuario->load('rol'));
    }

    public function destroy(Request $request, Usuario $usuario)
    {
        $actor = $request->user();

        if ($actor->id_usuario === $usuario->id_usuario) {
            return response()->json(['message' => 'No puede eliminarse a sí mismo.'], 409);
        }

        if ($usuario->rol->nombre === 'ADMINISTRADOR' && $this->esUltimoAdminActivo($usuario)) {
            return response()->json(['message' => 'Debe existir al menos un administrador activo.'], 409);
        }

        $usuario->delete();

        return response()->json(['message' => 'Usuario eliminado.']);
    }

    private function esUltimoAdminActivo(Usuario $usuario): bool
    {
        if ($usuario->rol->nombre !== 'ADMINISTRADOR' || $usuario->estado !== 'activo') {
            return false;
        }

        $otrosAdminsActivos = Usuario::whereHas('rol', fn ($q) => $q->where('nombre', 'ADMINISTRADOR'))
            ->where('estado', 'activo')
            ->where('id_usuario', '!=', $usuario->id_usuario)
            ->count();

        return $otrosAdminsActivos === 0;
    }
}
