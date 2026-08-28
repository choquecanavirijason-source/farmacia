<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\Medicament;
use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class OperationsSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::factory()->count(100)->create();
        $medicament = Medicament::first();
        if ($medicament) {
            Batch::factory()->count(100)->create([
                'medicament_id' => fn () => Medicament::inRandomOrder()->value('id'),
            ]);
        }
        CashRegister::factory()->count(100)->create();
    }
}
