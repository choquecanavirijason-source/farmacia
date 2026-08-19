<?php

namespace Database\Seeders;

use App\Models\Proveedor;
use Illuminate\Database\Seeder;

class ProveedorSeeder extends Seeder
{
    public function run(): void
    {
        $proveedores = [
            [
                'nombre' => 'Distribuidora Boliviana de Medicamentos',
                'nit' => '1023456011',
                'telefono' => '22334455',
                'direccion' => 'Av. Circunvalación #123, Potosí',
                'email' => 'ventas@dibolmed.bo',
            ],
            [
                'nombre' => 'Droguería Inti S.R.L.',
                'nit' => '1078965022',
                'telefono' => '22558899',
                'direccion' => 'Calle Bolívar #456, Potosí',
                'email' => 'contacto@drogueriainti.bo',
            ],
        ];

        foreach ($proveedores as $proveedor) {
            Proveedor::create($proveedor);
        }
    }
}
