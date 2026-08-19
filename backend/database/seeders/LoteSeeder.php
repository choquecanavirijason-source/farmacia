<?php

namespace Database\Seeders;

use App\Models\Lote;
use App\Models\Medicamento;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class LoteSeeder extends Seeder
{
    public function run(): void
    {
        $medicamentos = Medicamento::pluck('id_medicamento', 'codigo');

        $lotes = [
            ['numero_lote' => 'L-2024-001', 'dias_vencimiento' => 400, 'cantidad_actual' => 120, 'precio_compra' => 7.2, 'codigo' => 'MED-0001'],
            ['numero_lote' => 'L-2024-002', 'dias_vencimiento' => 18, 'cantidad_actual' => 15, 'precio_compra' => 7.5, 'codigo' => 'MED-0001'],
            ['numero_lote' => 'L-2024-010', 'dias_vencimiento' => 250, 'cantidad_actual' => 40, 'precio_compra' => 16, 'codigo' => 'MED-0002'],
            ['numero_lote' => 'L-2024-015', 'dias_vencimiento' => 90, 'cantidad_actual' => 25, 'precio_compra' => 20, 'codigo' => 'MED-0003'],
            ['numero_lote' => 'L-2024-020', 'dias_vencimiento' => -5, 'cantidad_actual' => 8, 'precio_compra' => 9.8, 'codigo' => 'MED-0004'],
            ['numero_lote' => 'L-2024-021', 'dias_vencimiento' => 300, 'cantidad_actual' => 60, 'precio_compra' => 10.1, 'codigo' => 'MED-0004'],
        ];

        foreach ($lotes as $lote) {
            Lote::create([
                'numero_lote' => $lote['numero_lote'],
                'fecha_vencimiento' => Carbon::now()->addDays($lote['dias_vencimiento'])->toDateString(),
                'cantidad_actual' => $lote['cantidad_actual'],
                'precio_compra' => $lote['precio_compra'],
                'id_medicamento' => $medicamentos[$lote['codigo']],
            ]);
        }
    }
}
