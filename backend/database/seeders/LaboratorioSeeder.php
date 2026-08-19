<?php

namespace Database\Seeders;

use App\Models\Laboratorio;
use Illuminate\Database\Seeder;

class LaboratorioSeeder extends Seeder
{
    public function run(): void
    {
        $laboratorios = [
            ['nombre' => 'Bagó', 'pais' => 'Bolivia', 'telefono' => '22345678'],
            ['nombre' => 'Roche', 'pais' => 'Suiza', 'telefono' => '22456789'],
            ['nombre' => 'Inti', 'pais' => 'Bolivia', 'telefono' => '22567890'],
        ];

        foreach ($laboratorios as $laboratorio) {
            Laboratorio::create($laboratorio);
        }
    }
}
