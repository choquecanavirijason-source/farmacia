<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Seeder;

class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        // Cliente genérico usado por el POS: nunca se debe duplicar.
        Cliente::firstOrCreate(
            ['nombre' => 'Consumidor Final'],
            ['ci_nit' => '0']
        );

        $faker = fake('es_ES');
        $now = now();

        $clientes = [];
        for ($i = 0; $i < 1000; $i++) {
            $clientes[] = [
                'nombre' => $faker->firstName() . ' ' . $faker->lastName() . ' ' . $faker->lastName(),
                'ci_nit' => $faker->unique()->numerify('#######'),
                'telefono' => $faker->optional(0.85)->numerify('7#######'),
                'direccion' => $faker->optional(0.75)->streetAddress(),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insert en lote: 1000 filas en una sola consulta.
        Cliente::insert($clientes);
    }
}
