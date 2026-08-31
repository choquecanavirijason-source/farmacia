<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'], 
            [
                'name' => 'admin', 
                'username'=>'admin',
                'firstname' => 'System', 
                'lastname' => 'Administrator', 
                'password' => Hash::make('admin123'), 
                'state' => 'active'
            ]);
        $admin->syncRoles(['administrator']);
        $seller = User::updateOrCreate(
            ['email' => 'seller@example.com'], 
            [
                'name' => 'seller', 
                'username'=>'seller',
                'firstname' => 'Default', 
                'lastname' => 'Seller', 
                'password' => Hash::make('seller123'), 
                'state' => 'active'
            ]);
        $seller->syncRoles(['seller']);
    }
}
