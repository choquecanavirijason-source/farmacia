<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Dashboard
            'view dashboard',

            // Clientes
            'view clients',
            'create clients',
            'edit clients',
            'delete clients',
            'restore clients',
            'export clients',

            // Categorías
            'view categories',
            'create categories',
            'edit categories',
            'delete categories',
            'restore categories',
            'export categories',

            // Presentaciones
            'view presentations',
            'create presentations',
            'edit presentations',
            'delete presentations',
            'restore presentations',
            'export presentations',

            // Laboratorios
            'view laboratories',
            'create laboratories',
            'edit laboratories',
            'delete laboratories',
            'restore laboratories',
            'export laboratories',

            // Proveedores
            'view suppliers',
            'create suppliers',
            'edit suppliers',
            'delete suppliers',
            'restore suppliers',
            'export suppliers',

            // Medicamentos
            'view medicaments',
            'create medicaments',
            'edit medicaments',
            'delete medicaments',
            'restore medicaments',
            'export medicaments',

            // Lotes
            'view batches',
            'create batches',
            'edit batches',
            'delete batches',
            'restore batches',
            'export batches',
            'dispose batches',

            // Usuarios
            'view users',
            'create users',
            'edit users',
            'delete users',
            'restore users',
            'export users',

            // Roles
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',

            // Ventas / POS
            'view sales',
            'create sales',
            'void sales',
            'export sales',

            // Compras
            'view purchases',
            'create purchases',
            'export purchases',

            // Caja
            'view cash registers',
            'open cash registers',
            'close cash registers',
            'create cash movements',
            'export cash registers',

            // Inventario
            'view inventory',

            // Reportes
            'view reports',

            // Configuración
            'view settings',
            'edit settings',

            // Auditorías
            'view audits',
            'export audits',

            // Sucursales
            'view branches',
            'create branches',
            'edit branches',
            'delete branches',
            'restore branches',
            'export branches',
            'manage branch users',
            'create branch transfers',
            'view branch transfers',
            'export branch transfers',
        ];

        foreach ($permissions as $perm) {
            Permission::findOrCreate($perm, 'api');
        }

        $admin = Role::findOrCreate('administrator', 'api');
        $supervisor = Role::findOrCreate('supervisor', 'api');
        $seller = Role::findOrCreate('seller', 'api');

        // Admin gets all permissions
        $admin->syncPermissions(Permission::where('guard_name', 'api')->get());

        // Supervisor gets operational and management permissions
        $supervisorPermissions = [
            'view dashboard',
            'view clients',
            'create clients',
            'edit clients',
            'export clients',
            'view categories',
            'view presentations',
            'view laboratories',
            'view suppliers',
            'view medicaments',
            'view batches',
            'dispose batches',
            'view sales',
            'create sales',
            'void sales',
            'export sales',
            'view purchases',
            'view cash registers',
            'open cash registers',
            'close cash registers',
            'create cash movements',
            'export cash registers',
            'view inventory',
            'view reports',
            'view audits',
        ];

        $supervisor->syncPermissions(
            Permission::where('guard_name', 'api')
                ->whereIn('name', $supervisorPermissions)
                ->get()
        );

        // Seller gets daily operation permissions
        $sellerPermissions = [
            'view dashboard',
            'view clients',
            'create clients',
            'edit clients',
            'view medicaments',
            'view batches',
            'view sales',
            'create sales',
            'view cash registers',
            'open cash registers',
            'close cash registers',
            'create cash movements',
            'view inventory',
        ];

        $seller->syncPermissions(
            Permission::where('guard_name', 'api')
                ->whereIn('name', $sellerPermissions)
                ->get()
        );
    }
}
