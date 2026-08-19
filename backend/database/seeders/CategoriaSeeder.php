<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            ['nombre' => 'Analgésicos', 'descripcion' => 'Alivio del dolor'],
            ['nombre' => 'Antibióticos', 'descripcion' => 'Tratamiento de infecciones bacterianas'],
            ['nombre' => 'Antigripales', 'descripcion' => 'Síntomas de resfrío y gripe'],
            ['nombre' => 'Antiinflamatorios', 'descripcion' => 'Reducción de inflamación'],
        ];

        foreach ($categorias as $categoria) {
            Categoria::create($categoria);
        }
    }
}
