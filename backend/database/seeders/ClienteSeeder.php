<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Seeder;

class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        $clientes = [
            ['nombre' => 'Consumidor Final', 'ci_nit' => '0', 'telefono' => null, 'direccion' => null],
            ['nombre' => 'María Condori Quispe', 'ci_nit' => '5487621', 'telefono' => '71234567', 'direccion' => 'Calle Chuquisaca #212, Potosí'],
            ['nombre' => 'Juan Pérez Mamani', 'ci_nit' => '6123890', 'telefono' => '76543210', 'direccion' => 'Av. Universitaria #88, Potosí'],
        ];

        foreach ($clientes as $cliente) {
            Cliente::create($cliente);
        }
    }
}
