<?php

namespace App\Services;

use App\Exports\RecordsExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class RoleService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'id', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return Role::where('guard_name', 'api')
            ->with('permissions')
            ->withCount('users')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getAll(): Collection
    {
        return Role::where('guard_name', 'api')
            ->with('permissions')
            ->withCount('users')
            ->orderBy('name', 'asc')
            ->get();
    }

    public function create(array $data): Role
    {
        $permissions = $data['permissions'] ?? [];

        $role = Role::create([
            'name'       => $data['name'],
            'guard_name' => 'api',
        ]);

        if (!empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        return $role->load('permissions')->loadCount('users');
    }

    public function update(Role $role, array $data): Role
    {
        if (isset($data['name'])) {
            $role->name = $data['name'];
            $role->save();
        }

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $role->refresh()->load('permissions')->loadCount('users');
    }

    public function delete(int $id): void
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'administrator') {
            throw new HttpException(403, 'No se puede eliminar el rol de Administrador principal.');
        }

        $role->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $roles = Role::whereIn('id', $ids)->where('name', '!=', 'administrator')->get();
        foreach ($roles as $role) {
            $role->delete();
        }

        return $roles->count();
    }

    public function export(string $format, array|string $filters = []): Response
    {
        $search = is_array($filters) ? trim((string) ($filters['search'] ?? '')) : trim((string) $filters);
        $sortBy = is_array($filters) ? ($filters['sort_by'] ?? 'id') : 'id';
        $sortDir = is_array($filters) ? ($filters['sort_dir'] ?? 'asc') : 'asc';

        $items = Role::where('guard_name', 'api')
            ->with('permissions')
            ->withCount('users')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy($sortBy, $sortDir)
            ->get()
            ->map(fn ($r) => [
                'id'                => $r->id,
                'name'              => $r->name === 'administrator' ? 'Administrador' : ($r->name === 'seller' ? 'Vendedor' : $r->name),
                'users_count'       => $r->users_count,
                'permissions_count' => $r->permissions->count(),
            ]);

        $columns = [
            'ID'                   => 'id',
            'Nombre del Rol'       => 'name',
            'Cantidad de Usuarios' => 'users_count',
            'Total de Permisos'    => 'permissions_count',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Roles', 'columns' => $columns, 'records' => $items])->download('roles.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'roles.xlsx');
    }
}
