<?php

namespace Database\Factories;

use App\Models\Laboratory;
use Illuminate\Database\Eloquent\Factories\Factory;

class LaboratoryFactory extends Factory
{
    protected $model = Laboratory::class;

    public function definition(): array
    {
        return ['name' => $this->faker->unique()->company(), 'country' => $this->faker->country(), 'phone' => $this->faker->phoneNumber()];
    }
}
