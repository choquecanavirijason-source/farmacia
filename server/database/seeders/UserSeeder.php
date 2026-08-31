<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Administrador Principal
        $admin = User::updateOrCreate(
            ['email' => 'admin@farmacia.bo'],
            [
                'name' => 'admin',
                'username' => 'admin',
                'firstname' => 'Juan de Dios',
                'lastname' => 'Rocha Alcocer',
                'password' => Hash::make('admin123'),
                'state' => 'active',
            ]
        );
        $admin->syncRoles(['administrator']);

        // Vendedora / Regente Farmacéutica
        $seller = User::updateOrCreate(
            ['email' => 'vendedora@farmacia.bo'],
            [
                'name' => 'vendedora',
                'username' => 'paola.vargas',
                'firstname' => 'Paola Andrea',
                'lastname' => 'Vargas Montaño',
                'password' => Hash::make('vendedor123'),
                'state' => 'active',
            ]
        );
        $seller->syncRoles(['seller']);

        // Usuario adicional de apoyo
        $seller2 = User::updateOrCreate(
            ['email' => 'cajero@farmacia.bo'],
            [
                'name' => 'cajero',
                'username' => 'rodrigo.claros',
                'firstname' => 'Rodrigo',
                'lastname' => 'Claros Torrico',
                'password' => Hash::make('caja123'),
                'state' => 'active',
            ]
        );
        $seller2->syncRoles(['seller']);
    }
}
