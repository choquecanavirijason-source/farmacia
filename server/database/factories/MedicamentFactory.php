<?php

namespace Database\Factories;

use App\Models\Medicament;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicamentFactory extends Factory
{
    protected $model = Medicament::class;

    public function definition(): array
    {
        return ['code' => $this->faker->unique()->bothify('MED-###'), 'name' => $this->faker->word(), 'concentration' => $this->faker->numberBetween(100, 1000).' mg', 'price' => $this->faker->randomFloat(2, 1, 100), 'min_stock' => 10, 'requires_prescription' => false, 'status' => 'active'];
    }
}
