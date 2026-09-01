<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        $status = $filters['status'] ?? 'active';
        $search = trim((string) ($filters['search'] ?? ''));
        $role = $filters['role'] ?? null;

        $query = match ($status) {
            'trashed' => User::onlyTrashed(),
            'all'     => User::withTrashed(),
            default   => User::withoutTrashed(),
        };

        if (!empty($role)) {
            $query->whereHas('roles', function ($q) use ($role) {
                if (is_numeric($role)) {
                    $q->where('roles.id', (int) $role);
                } else {
                    $q->where('roles.name', $role);
                }
            });
        }

        return $query
            ->with('roles')
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): User
    {
        $roles = $data['roles'] ?? (!empty($data['role']) ? [$data['role']] : []);
        unset($data['role'], $data['roles']);
        $data['password'] = Hash::make($data['password']);
        $data['state'] = 'active';

        $user = User::create($data);
        if (!empty($roles)) {
            $user->syncRoles((array) $roles);
        }

        return $user->load('roles');
    }

    public function update(User $user, array $data): User
    {
        $roles = $data['roles'] ?? ($data['role'] ?? null);
        unset($data['role'], $data['roles']);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        if ($roles !== null) {
            $rolesList = (array) $roles;
            if ($user->id === 1 && !in_array('administrator', $rolesList, true)) {
                $rolesList[] = 'administrator';
            }
            $user->syncRoles($rolesList);
        }

        return $user->refresh()->load('roles');
    }

    public function delete(int $id, ?int $currentAuthId = null): void
    {
        $user = User::findOrFail($id);

        if ($user->id === 1 || $user->username === 'admin' || $user->email === 'admin@farmacia.bo') {
            throw new HttpException(403, 'No se puede eliminar al usuario administrador principal del sistema.');
        }

        if ($currentAuthId && $user->id === $currentAuthId) {
            throw new HttpException(403, 'No puedes eliminar tu propia cuenta de usuario.');
        }

        $user->delete();
    }

    public function bulkDelete(array $ids, ?int $currentAuthId = null): int
    {
        $users = User::whereIn('id', $ids)
            ->where('id', '!=', 1)
            ->where('username', '!=', 'admin')
            ->where('email', '!=', 'admin@farmacia.bo')
            ->when($currentAuthId, fn ($q) => $q->where('id', '!=', $currentAuthId))
            ->get();

        foreach ($users as $user) {
            $user->delete();
        }

        return $users->count();
    }

    public function restore(int $id): User
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return $user->load('roles');
    }

    public function export(string $format, array $filters): Response
    {
        $status = $filters['status'] ?? 'active';
        $search = trim((string) ($filters['search'] ?? ''));
        $role = $filters['role'] ?? null;
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $query = match ($status) {
            'trashed' => User::onlyTrashed(),
            'all'     => User::withTrashed(),
            default   => User::withoutTrashed(),
        };

        if (!empty($role)) {
            $query->whereHas('roles', function ($q) use ($role) {
                if (is_numeric($role)) {
                    $q->where('roles.id', (int) $role);
                } else {
                    $q->where('roles.name', $role);
                }
            });
        }

        $items = $query
            ->with('roles')
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get()
            ->map(fn ($u) => [
                'name'       => $u->name,
                'username'   => $u->username ?? '—',
                'email'      => $u->email,
                'role_names' => $u->roles->pluck('name')->map(fn ($r) => match ($r) {
                    'administrator' => 'Administrador',
                    'seller'        => 'Vendedor',
                    default         => ucfirst($r),
                })->join(', ') ?: 'Sin rol',
                'status'     => $u->deleted_at ? 'Eliminado' : 'Activo',
            ]);

        $columns = [
            'Nombre'  => 'name',
            'Usuario' => 'username',
            'Email'   => 'email',
            'Rol'     => 'role_names',
            'Estado'  => 'status',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Usuarios', 'columns' => $columns, 'records' => $items])->download('usuarios.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'usuarios.xlsx');
    }
}
