<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\Medicament;
use App\Models\PaymentMethod;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OperationsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Formas de Pago Reales en Bolivia
        $paymentMethods = [
            ['name' => 'Efectivo', 'status' => 'active'],
            ['name' => 'Pago QR / Transferencia', 'status' => 'active'],
            ['name' => 'Tarjeta de Débito', 'status' => 'active'],
            ['name' => 'Tarjeta de Crédito', 'status' => 'active'],
        ];

        foreach ($paymentMethods as $pm) {
            PaymentMethod::firstOrCreate(['name' => $pm['name']], $pm);
        }

        // 2. Lotes y Existencias Reales por Medicamento
        $medicaments = Medicament::all();
        $adminUser = User::first();
        $userId = $adminUser ? $adminUser->id : 1;

        $batchIndex = 100;
        foreach ($medicaments as $med) {
            $batchIndex++;
            $baseCost = round($med->price * 0.65, 2); // Margen comercial ~35%

            // Lote 1: Lote Principal con buena vigencia (vence en 2027/2028)
            Batch::firstOrCreate(
                ['batch_number' => "LOT-2025-A{$med->id}"],
                [
                    'expiration_date' => Carbon::now()->addMonths(rand(18, 36))->toDateString(),
                    'current_quantity' => rand(50, 150),
                    'purchase_price' => $baseCost,
                    'medicament_id' => $med->id,
                    'created_id' => $userId,
                ]
            );

            // Para algunos medicamentos (ej. 3 de ellos), creamos un segundo lote próximo a vencer (<90 días) para probar alertas preventivas
            if ($med->id % 6 === 0) {
                Batch::firstOrCreate(
                    ['batch_number' => "LOT-2024-EXP{$med->id}"],
                    [
                        'expiration_date' => Carbon::now()->addDays(rand(20, 65))->toDateString(),
                        'current_quantity' => rand(5, 18),
                        'purchase_price' => $baseCost,
                        'medicament_id' => $med->id,
                        'created_id' => $userId,
                    ]
                );
            }
        }

        // 3. Cajas (Historial cerrado + Caja abierta del turno de hoy)
        // Caja cerrada de ayer
        CashRegister::firstOrCreate(
            ['opened_at' => Carbon::yesterday()->setTime(8, 0, 0)],
            [
                'opening_amount' => 200.00,
                'closed_at' => Carbon::yesterday()->setTime(21, 30, 0),
                'closing_amount' => 1845.50,
                'expected_closing_amount' => 1845.50,
                'status' => 'closed',
                'created_id' => $userId,
            ]
        );

        // Caja abierta de hoy
        CashRegister::firstOrCreate(
            ['status' => 'open'],
            [
                'opened_at' => Carbon::today()->setTime(8, 0, 0),
                'opening_amount' => 200.00,
                'status' => 'open',
                'created_id' => $userId,
            ]
        );
    }
}
