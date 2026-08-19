<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Laboratorio;
use App\Models\Medicamento;
use App\Models\Presentacion;
use Illuminate\Database\Seeder;

class MedicamentoSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = Categoria::pluck('id_categoria', 'nombre');
        $presentaciones = Presentacion::pluck('id_presentacion', 'nombre');
        $laboratorios = Laboratorio::pluck('id_laboratorio', 'nombre');

        $medicamentos = [
            [
                'codigo' => 'MED-0001',
                'nombre' => 'Paracetamol',
                'concentracion' => '500 mg',
                'precio_venta' => 12.5,
                'stock_minimo' => 20,
                'requiere_receta' => false,
                'estado' => 'activo',
                'categoria' => 'Analgésicos',
                'presentacion' => 'Tableta',
                'laboratorio' => 'Bagó',
            ],
            [
                'codigo' => 'MED-0002',
                'nombre' => 'Amoxicilina',
                'concentracion' => '500 mg',
                'precio_venta' => 28,
                'stock_minimo' => 15,
                'requiere_receta' => true,
                'estado' => 'activo',
                'categoria' => 'Antibióticos',
                'presentacion' => 'Cápsula',
                'laboratorio' => 'Inti',
            ],
            [
                'codigo' => 'MED-0003',
                'nombre' => 'Jarabe para la tos Bisolvon',
                'concentracion' => '8 mg/5 ml',
                'precio_venta' => 35.9,
                'stock_minimo' => 10,
                'requiere_receta' => false,
                'estado' => 'activo',
                'categoria' => 'Antigripales',
                'presentacion' => 'Jarabe',
                'laboratorio' => 'Roche',
            ],
            [
                'codigo' => 'MED-0004',
                'nombre' => 'Ibuprofeno',
                'concentracion' => '400 mg',
                'precio_venta' => 15.5,
                'stock_minimo' => 25,
                'requiere_receta' => false,
                'estado' => 'activo',
                'categoria' => 'Antiinflamatorios',
                'presentacion' => 'Tableta',
                'laboratorio' => 'Bagó',
            ],
            [
                'codigo' => 'MED-0005',
                'nombre' => 'Diclofenaco inyectable',
                'concentracion' => '75 mg/3 ml',
                'precio_venta' => 9.5,
                'stock_minimo' => 12,
                'requiere_receta' => true,
                'estado' => 'inactivo',
                'categoria' => 'Antiinflamatorios',
                'presentacion' => 'Ampolla',
                'laboratorio' => 'Inti',
            ],
        ];

        foreach ($medicamentos as $medicamento) {
            Medicamento::create([
                'codigo' => $medicamento['codigo'],
                'nombre' => $medicamento['nombre'],
                'concentracion' => $medicamento['concentracion'],
                'precio_venta' => $medicamento['precio_venta'],
                'stock_minimo' => $medicamento['stock_minimo'],
                'requiere_receta' => $medicamento['requiere_receta'],
                'estado' => $medicamento['estado'],
                'id_categoria' => $categorias[$medicamento['categoria']],
                'id_presentacion' => $presentaciones[$medicamento['presentacion']],
                'id_laboratorio' => $laboratorios[$medicamento['laboratorio']],
            ]);
        }
    }
}
