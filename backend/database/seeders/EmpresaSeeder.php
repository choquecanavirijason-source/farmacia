<?php

namespace Database\Seeders;

use App\Models\Empresa;
use Illuminate\Database\Seeder;

class EmpresaSeeder extends Seeder
{
    public function run(): void
    {
        Empresa::create([
            'nombre' => 'Farmacia Juan de Dios',
            'nit' => null,
            'direccion' => 'Potosí, Bolivia',
            'telefono' => null,
            'logo_path' => null,
        ]);
    }
}
