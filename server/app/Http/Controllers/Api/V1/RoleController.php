<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Roles\StoreRoleRequest;
use App\Http\Requests\Roles\UpdateRoleRequest;
use App\Http\Resources\Roles\RoleResource;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Role::with('permissions')
            ->withCount('users')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy(
                (string) $request->query('sort_by', 'id'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(RoleResource::collection($result), 'Roles obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $role = Role::with('permissions')->withCount('users')->findOrFail($id);

        return $this->resourceResponse(new RoleResource($role), 'Rol obtenido con éxito.');
    }

    public function store(StoreRoleRequest $request)
    {
        $data = $request->validated();
        $permissions = $data['permissions'] ?? [];

        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => 'api',
        ]);

        if (!empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        return $this->createdResponse(new RoleResource($role->load('permissions')->loadCount('users')), 'Rol creado con éxito.');
    }

    public function update(UpdateRoleRequest $request, int $id)
    {
        $role = Role::findOrFail($id);
        $data = $request->validated();

        if (isset($data['name'])) {
            $role->name = $data['name'];
            $role->save();
        }

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $this->updatedResponse(new RoleResource($role->load('permissions')->loadCount('users')), 'Rol actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'administrator') {
            return $this->errorResponse('No se puede eliminar el rol de Administrador principal.', 403);
        }

        $role->delete();

        return $this->deletedResponse('Rol eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = (array) $request->ids;
        $roles = Role::whereIn('id', $ids)->get();

        foreach ($roles as $role) {
            if ($role->name !== 'administrator') {
                $role->delete();
            }
        }

        return $this->deletedResponse('Roles seleccionados eliminados con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Role::with('permissions')
            ->withCount('users')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'name' => $r->name,
                    'users_count' => $r->users_count,
                    'permissions_count' => $r->permissions->count(),
                ];
            });

        return strtolower((string) $request->query('format', 'excel')) === 'pdf'
            ? $this->exportPdf($items)
            : $this->exportExcel($items);
    }

    public function permissions()
    {
        $permissions = Permission::where('guard_name', 'api')
            ->orWhere('guard_name', 'web')
            ->get()
            ->unique('name');

        $groups = [
            'clientes' => [
                'title' => 'Clientes',
                'description' => 'Acceso y gestión del padrón de clientes',
                'permissions' => [
                    ['name' => 'view clients', 'label' => 'Ver listado de clientes'],
                    ['name' => 'create clients', 'label' => 'Crear nuevos clientes'],
                    ['name' => 'edit clients', 'label' => 'Editar datos de clientes'],
                    ['name' => 'delete clients', 'label' => 'Eliminar clientes'],
                    ['name' => 'restore clients', 'label' => 'Restaurar clientes eliminados'],
                    ['name' => 'export clients', 'label' => 'Exportar clientes (Excel/PDF)'],
                ],
            ],
            'medicamentos' => [
                'title' => 'Medicamentos y Catálogos',
                'description' => 'Gestión de productos, categorías, laboratorios y presentaciones',
                'permissions' => [
                    ['name' => 'view medicaments', 'label' => 'Ver medicamentos'],
                    ['name' => 'create medicaments', 'label' => 'Crear medicamentos'],
                    ['name' => 'edit medicaments', 'label' => 'Editar medicamentos'],
                    ['name' => 'delete medicaments', 'label' => 'Eliminar medicamentos'],
                    ['name' => 'restore medicaments', 'label' => 'Restaurar medicamentos'],
                    ['name' => 'export medicaments', 'label' => 'Exportar medicamentos'],

                    ['name' => 'view categories', 'label' => 'Ver categorías'],
                    ['name' => 'create categories', 'label' => 'Crear categorías'],
                    ['name' => 'edit categories', 'label' => 'Editar categorías'],
                    ['name' => 'delete categories', 'label' => 'Eliminar categorías'],
                    ['name' => 'restore categories', 'label' => 'Restaurar categorías'],
                    ['name' => 'export categories', 'label' => 'Exportar categorías'],

                    ['name' => 'view presentations', 'label' => 'Ver presentaciones'],
                    ['name' => 'create presentations', 'label' => 'Crear presentaciones'],
                    ['name' => 'edit presentations', 'label' => 'Editar presentaciones'],
                    ['name' => 'delete presentations', 'label' => 'Eliminar presentaciones'],
                    ['name' => 'restore presentations', 'label' => 'Restaurar presentaciones'],
                    ['name' => 'export presentations', 'label' => 'Exportar presentaciones'],

                    ['name' => 'view laboratories', 'label' => 'Ver laboratorios'],
                    ['name' => 'create laboratories', 'label' => 'Crear laboratorios'],
                    ['name' => 'edit laboratories', 'label' => 'Editar laboratorios'],
                    ['name' => 'delete laboratories', 'label' => 'Eliminar laboratorios'],
                    ['name' => 'restore laboratories', 'label' => 'Restaurar laboratorios'],
                    ['name' => 'export laboratories', 'label' => 'Exportar laboratorios'],
                ],
            ],
            'lotes' => [
                'title' => 'Lotes y Stock',
                'description' => 'Control de vencimientos, ingresos de lote y bajas de stock',
                'permissions' => [
                    ['name' => 'view batches', 'label' => 'Ver lotes y stock'],
                    ['name' => 'create batches', 'label' => 'Registrar nuevo lote'],
                    ['name' => 'edit batches', 'label' => 'Editar lote / vencimiento'],
                    ['name' => 'delete batches', 'label' => 'Eliminar lote'],
                    ['name' => 'restore batches', 'label' => 'Restaurar lote'],
                    ['name' => 'export batches', 'label' => 'Exportar lotes'],
                    ['name' => 'dispose batches', 'label' => 'Dar de baja stock / Ajuste kardex'],
                ],
            ],
            'proveedores' => [
                'title' => 'Proveedores',
                'description' => 'Gestión de distribuidores y proveedores farmacéuticos',
                'permissions' => [
                    ['name' => 'view suppliers', 'label' => 'Ver proveedores'],
                    ['name' => 'create suppliers', 'label' => 'Crear proveedores'],
                    ['name' => 'edit suppliers', 'label' => 'Editar proveedores'],
                    ['name' => 'delete suppliers', 'label' => 'Eliminar proveedores'],
                    ['name' => 'restore suppliers', 'label' => 'Restaurar proveedores'],
                    ['name' => 'export suppliers', 'label' => 'Exportar proveedores'],
                ],
            ],
            'ventas' => [
                'title' => 'Ventas y Punto de Venta (POS)',
                'description' => 'Cobro en mostrador, emisión de facturas y anulación',
                'permissions' => [
                    ['name' => 'view sales', 'label' => 'Ver historial de ventas'],
                    ['name' => 'create sales', 'label' => 'Realizar ventas (POS)'],
                    ['name' => 'void sales', 'label' => 'Anular ventas'],
                    ['name' => 'export sales', 'label' => 'Exportar ventas'],
                ],
            ],
            'compras' => [
                'title' => 'Compras e Ingresos',
                'description' => 'Registro de compras a proveedores con facturas',
                'permissions' => [
                    ['name' => 'view purchases', 'label' => 'Ver compras'],
                    ['name' => 'create purchases', 'label' => 'Registrar nueva compra'],
                    ['name' => 'export purchases', 'label' => 'Exportar compras'],
                ],
            ],
            'caja' => [
                'title' => 'Caja y Turnos',
                'description' => 'Apertura, arqueos, cierres y movimientos de efectivo',
                'permissions' => [
                    ['name' => 'view cash registers', 'label' => 'Ver movimientos y cierres de caja'],
                    ['name' => 'open cash registers', 'label' => 'Abrir caja diaria'],
                    ['name' => 'close cash registers', 'label' => 'Cerrar caja y cuadrar arqueo'],
                    ['name' => 'create cash movements', 'label' => 'Registrar ingresos/egresos manuales'],
                    ['name' => 'export cash registers', 'label' => 'Exportar movimientos de caja'],
                ],
            ],
            'inventario' => [
                'title' => 'Consulta de Inventario',
                'description' => 'Vista consolidada de existencias e inventario valorizado',
                'permissions' => [
                    ['name' => 'view inventory', 'label' => 'Consultar inventario y alertas'],
                ],
            ],
            'reportes' => [
                'title' => 'Reportes y Estadísticas',
                'description' => 'Reportes de ventas, productos más vendidos y kardex',
                'permissions' => [
                    ['name' => 'view reports', 'label' => 'Acceso al módulo de reportes'],
                ],
            ],
            'usuarios' => [
                'title' => 'Usuarios y Accesos',
                'description' => 'Cuentas de usuario y asignación de roles',
                'permissions' => [
                    ['name' => 'view users', 'label' => 'Ver usuarios'],
                    ['name' => 'create users', 'label' => 'Crear usuarios'],
                    ['name' => 'edit users', 'label' => 'Editar usuarios'],
                    ['name' => 'delete users', 'label' => 'Eliminar usuarios'],
                    ['name' => 'restore users', 'label' => 'Restaurar usuarios'],
                    ['name' => 'export users', 'label' => 'Exportar usuarios'],
                ],
            ],
            'roles' => [
                'title' => 'Roles y Permisos',
                'description' => 'Configuración de perfiles y permisos del sistema',
                'permissions' => [
                    ['name' => 'view roles', 'label' => 'Ver roles y permisos'],
                    ['name' => 'create roles', 'label' => 'Crear roles'],
                    ['name' => 'edit roles', 'label' => 'Editar roles y asignar permisos'],
                    ['name' => 'delete roles', 'label' => 'Eliminar roles'],
                ],
            ],
            'configuracion' => [
                'title' => 'Configuración de Empresa',
                'description' => 'Datos fiscales, logotipo y razón social de la farmacia',
                'permissions' => [
                    ['name' => 'view settings', 'label' => 'Ver configuración de empresa'],
                    ['name' => 'edit settings', 'label' => 'Modificar datos de empresa y logo'],
                ],
            ],
            'auditorias' => [
                'title' => 'Registro de Auditoría',
                'description' => 'Trazabilidad y registro de cambios en el sistema',
                'permissions' => [
                    ['name' => 'view audits', 'label' => 'Ver panel de auditoría'],
                    ['name' => 'export audits', 'label' => 'Exportar registros de auditoría'],
                ],
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'all' => $permissions->pluck('name'),
                'groups' => $groups,
            ],
        ]);
    }

    private function exportExcel($items)
    {
        return Excel::download(new RecordsExport($items, [
            'ID' => 'id',
            'Rol' => 'name',
            'Usuarios Asignados' => 'users_count',
            'Total Permisos' => 'permissions_count',
        ]), 'roles.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title' => 'Reporte de Roles del Sistema',
            'columns' => [
                'ID' => 'id',
                'Rol' => 'name',
                'Usuarios Asignados' => 'users_count',
                'Total Permisos' => 'permissions_count',
            ],
            'records' => $items,
        ])->download('roles.pdf');
    }
}
