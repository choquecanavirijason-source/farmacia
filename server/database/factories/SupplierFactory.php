<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return ['name' => $this->faker->company(), 'nit' => $this->faker->unique()->numerify('##########'), 'phone' => $this->faker->phoneNumber(), 'address' => $this->faker->address(), 'email' => $this->faker->safeEmail()];
    }
}
