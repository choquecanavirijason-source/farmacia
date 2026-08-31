<?php

namespace Database\Factories;

use App\Models\Batch;
use Illuminate\Database\Eloquent\Factories\Factory;

class BatchFactory extends Factory
{
    protected $model = Batch::class;

    public function definition(): array
    {
        return ['batch_number' => $this->faker->unique()->bothify('BATCH-###'), 'expiration_date' => $this->faker->dateTimeBetween('+3 months', '+2 years'), 'current_quantity' => $this->faker->numberBetween(1, 500), 'purchase_price' => $this->faker->randomFloat(2, 1, 80)];
    }
}
