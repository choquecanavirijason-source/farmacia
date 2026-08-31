<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return ['name' => $this->faker->company(), 'nit' => $this->faker->unique()->numerify('##########'), 'address' => $this->faker->address(), 'phone' => $this->faker->phoneNumber(), 'email' => $this->faker->safeEmail()];
    }
}
