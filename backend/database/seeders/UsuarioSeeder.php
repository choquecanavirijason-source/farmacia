<?php

namespace Database\Seeders;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $administrador = Rol::where('nombre', 'ADMINISTRADOR')->firstOrFail();
        $vendedor = Rol::where('nombre', 'VENDEDOR')->firstOrFail();

        Usuario::create([
            'nombre' => 'Administrador',
            'usuario' => 'admin',
            'contrasena' => Hash::make('admin123'),
            'estado' => 'activo',
            'fecha_registro' => now()->toDateString(),
            'id_rol' => $administrador->id_rol,
        ]);

        Usuario::create([
            'nombre' => 'Vendedor',
            'usuario' => 'vendedor',
            'contrasena' => Hash::make('vendedor123'),
            'estado' => 'activo',
            'fecha_registro' => now()->toDateString(),
            'id_rol' => $vendedor->id_rol,
        ]);
    }
}
