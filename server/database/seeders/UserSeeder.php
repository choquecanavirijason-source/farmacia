<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(['email' => 'admin@example.com'], ['name' => 'Administrator', 'firstname' => 'System', 'lastname' => 'Administrator', 'password' => Hash::make('password'), 'state' => 'active']);
        $admin->syncRoles(['administrator']);
        $seller = User::updateOrCreate(['email' => 'seller@example.com'], ['name' => 'Seller', 'firstname' => 'Default', 'lastname' => 'Seller', 'password' => Hash::make('password'), 'state' => 'active']);
        $seller->syncRoles(['seller']);
    }
}
