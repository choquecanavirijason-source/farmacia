<?php

namespace Database\Seeders;

use App\Models\Presentacion;
use Illuminate\Database\Seeder;

class PresentacionSeeder extends Seeder
{
    public function run(): void
    {
        $presentaciones = [
            ['nombre' => 'Tableta', 'descripcion' => 'Forma sólida oral'],
            ['nombre' => 'Jarabe', 'descripcion' => 'Forma líquida oral'],
            ['nombre' => 'Ampolla', 'descripcion' => 'Forma inyectable'],
            ['nombre' => 'Cápsula', 'descripcion' => 'Forma sólida oral'],
        ];

        foreach ($presentaciones as $presentacion) {
            Presentacion::create($presentacion);
        }
    }
}
