<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. ADMINISTRADORES
        $admin1 = User::updateOrCreate(
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
        $admin1->syncRoles(['administrator']);

        $admin2 = User::updateOrCreate(
            ['email' => 'carlos.mendoza@farmacia.bo'],
            [
                'name' => 'carlos.mendoza',
                'username' => 'carlos.mendoza',
                'firstname' => 'Carlos',
                'lastname' => 'Mendoza Vaca',
                'password' => Hash::make('admin123'),
                'state' => 'active',
            ]
        );
        $admin2->syncRoles(['administrator']);

        // 2. SUPERVISORES
        $sup1 = User::updateOrCreate(
            ['email' => 'laura.fernandez@farmacia.bo'],
            [
                'name' => 'laura.fernandez',
                'username' => 'laura.fernandez',
                'firstname' => 'Laura',
                'lastname' => 'Fernández Rios',
                'password' => Hash::make('supervisor123'),
                'state' => 'active',
            ]
        );
        $sup1->syncRoles(['supervisor']);

        $sup2 = User::updateOrCreate(
            ['email' => 'marcelo.quiroga@farmacia.bo'],
            [
                'name' => 'marcelo.quiroga',
                'username' => 'marcelo.quiroga',
                'firstname' => 'Marcelo',
                'lastname' => 'Quiroga Santa Cruz',
                'password' => Hash::make('supervisor123'),
                'state' => 'active',
            ]
        );
        $sup2->syncRoles(['supervisor']);

        // 3. VENDEDORES / CAJEROS
        $seller1 = User::updateOrCreate(
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
        $seller1->syncRoles(['seller']);

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

        $seller3 = User::updateOrCreate(
            ['email' => 'ana.gutierrez@farmacia.bo'],
            [
                'name' => 'ana.gutierrez',
                'username' => 'ana.gutierrez',
                'firstname' => 'Ana Belén',
                'lastname' => 'Gutiérrez Flores',
                'password' => Hash::make('vendedor123'),
                'state' => 'active',
            ]
        );
        $seller3->syncRoles(['seller']);

        $seller4 = User::updateOrCreate(
            ['email' => 'javier.lopez@farmacia.bo'],
            [
                'name' => 'javier.lopez',
                'username' => 'javier.lopez',
                'firstname' => 'Javier',
                'lastname' => 'López Balderrama',
                'password' => Hash::make('vendedor123'),
                'state' => 'active',
            ]
        );
        $seller4->syncRoles(['seller']);

        $seller5 = User::updateOrCreate(
            ['email' => 'carla.soliz@farmacia.bo'],
            [
                'name' => 'carla.soliz',
                'username' => 'carla.soliz',
                'firstname' => 'Carla',
                'lastname' => 'Soliz Meneses',
                'password' => Hash::make('vendedor123'),
                'state' => 'active',
            ]
        );
        $seller5->syncRoles(['seller']);
    }
}
