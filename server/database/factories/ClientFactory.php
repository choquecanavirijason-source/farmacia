<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return ['firstname' => $this->faker->firstName(), 'lastname' => $this->faker->lastName(), 'ci' => $this->faker->optional()->numerify('########'), 'nit' => $this->faker->optional()->numerify('##########'), 'phone' => $this->faker->phoneNumber(), 'address' => $this->faker->address()];
    }
}
