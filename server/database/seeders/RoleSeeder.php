<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $names = ['view dashboard', 'manage users', 'manage roles', 'manage categories', 'manage presentations', 'manage laboratories', 'manage medicaments', 'manage suppliers', 'manage clients', 'manage purchases', 'manage sales', 'manage cash registers', 'view reports'];
        foreach ($names as $name) {
            Permission::findOrCreate($name, 'web');
        } $admin = Role::findOrCreate('administrator', 'web');
        $seller = Role::findOrCreate('seller', 'web');
        $admin->syncPermissions(Permission::all());
        $seller->syncPermissions(['view dashboard', 'manage clients', 'manage sales', 'manage cash registers']);
    }
}
