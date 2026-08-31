<?php

namespace Database\Factories;

use App\Models\CashRegister;
use Illuminate\Database\Eloquent\Factories\Factory;

class CashRegisterFactory extends Factory
{
    protected $model = CashRegister::class;

    public function definition(): array
    {
        return ['opened_at' => now(), 'opening_amount' => 0, 'status' => 'open'];
    }
}
