<?php

namespace Database\Seeders;

use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolSeeder extends Seeder
{
    public function run(): void
    {
        Rol::create([
            'nombre' => 'ADMINISTRADOR',
            'descripcion' => 'Acceso completo al sistema: catálogos, inventario, ventas, compras, caja y reportes.',
        ]);

        Rol::create([
            'nombre' => 'VENDEDOR',
            'descripcion' => 'Acceso al punto de venta, caja e inventario de consulta.',
        ]);
    }
}
