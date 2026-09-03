<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Company;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class BranchService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return Branch::withTrashed()
            ->withCount('users')
            ->when(!empty($filters['search']), fn ($q) => $q->search($filters['search']))
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Branch
    {
        $data['company_id'] = $data['company_id'] ?? Company::query()->value('id');
        $data['status'] = $data['status'] ?? 'active';
        return Branch::create($data);
    }

    public function update(Branch $branch, array $data): Branch
    {
        $branch->update($data);
        return $branch->refresh();
    }

    public function delete(int $id): void
    {
        Branch::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $branches = Branch::whereIn('id', $ids)->get();
        foreach ($branches as $branch) {
            $branch->delete();
        }
        return $branches->count();
    }

    public function restore(int $id): Branch
    {
        $branch = Branch::onlyTrashed()->findOrFail($id);
        $branch->restore();
        return $branch;
    }

    public function export(string $format, array $filters = [], string $sortBy = 'name', string $sortDir = 'asc'): Response
    {
        $records = Branch::withTrashed()
            ->when(!empty($filters['search']), fn ($q) => $q->search($filters['search']))
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Nombre'    => 'name',
            'Dirección' => 'address',
            'Teléfono'  => 'phone',
            'Estado'    => 'status',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Sucursales', 'columns' => $columns, 'records' => $records])->download('sucursales.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'sucursales.xlsx');
    }

    /** Sincroniza qué usuarios pertenecen a esta sucursal, sin tocar su sucursal por defecto/activa. */
    public function assignUsers(Branch $branch, array $userIds): Branch
    {
        $branch->users()->syncWithoutDetaching($userIds);

        // Los usuarios que quedaron fuera de la lista se desvinculan, salvo que
        // sea su única sucursal (evita dejar a alguien sin ninguna sucursal).
        $toRemove = $branch->users()->whereNotIn('users.id', $userIds ?: [0])->get();
        foreach ($toRemove as $user) {
            if ($user->branches()->count() > 1) {
                $branch->users()->detach($user->id);
                if ($user->active_branch_id === $branch->id) {
                    $fallback = $user->branches()->where('branches.id', '!=', $branch->id)->first();
                    $user->update(['active_branch_id' => $fallback?->id]);
                }
            }
        }

        return $branch->fresh('users');
    }

    /** Cambia la sucursal activa del usuario, validando membresía y que no deje una caja huérfana. */
    public function switchActive(User $user, int $branchId): User
    {
        if (!$user->branches()->where('branches.id', $branchId)->exists()) {
            throw ValidationException::withMessages([
                'branch_id' => ['No tienes acceso a esa sucursal.'],
            ]);
        }

        if ($user->active_branch_id) {
            $hasOpenRegister = CashRegister::where('branch_id', $user->active_branch_id)
                ->where('status', 'open')
                ->exists();

            if ($hasOpenRegister) {
                throw ValidationException::withMessages([
                    'branch_id' => ['Cierra la caja abierta de tu sucursal actual antes de cambiar de sucursal.'],
                ]);
            }
        }

        $user->update(['active_branch_id' => $branchId]);

        return $user->fresh();
    }
}
