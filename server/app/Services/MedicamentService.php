<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\InventoryMovement;
use App\Models\Medicament;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class MedicamentService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));

        // `status` ya es el campo activo/inactivo del propio medicamento; el filtro de
        // eliminados lógicos usa una llave distinta para no chocar con ese.
        $query = match ($filters['deleted'] ?? 'active') {
            'active'             => Medicament::withoutTrashed(),
            'trashed', 'deleted' => Medicament::onlyTrashed(),
            default              => Medicament::withTrashed(),
        };

        return $query
            ->with(['category', 'presentation', 'laboratory', 'batches.branch'])
            ->withSum('batches as total_stock', 'current_quantity')
            ->when($search !== '', fn ($q) => $q->search($search))
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getById(int $id): Medicament
    {
        return Medicament::withTrashed()
            ->with(['category', 'presentation', 'laboratory', 'batches.branch'])
            ->withSum('batches as total_stock', 'current_quantity')
            ->findOrFail($id);
    }

    public function create(array $data): Medicament
    {
        return Medicament::create($data);
    }

    public function update(Medicament $medicament, array $data): Medicament
    {
        $medicament->update($data);
        return $medicament->refresh();
    }

    public function delete(int $id): void
    {
        Medicament::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $medicaments = Medicament::whereIn('id', $ids)->get();
        foreach ($medicaments as $medicament) {
            $medicament->delete();
        }
        return $medicaments->count();
    }

    public function restore(int $id): Medicament
    {
        $medicament = Medicament::onlyTrashed()->findOrFail($id);
        $medicament->restore();
        return $medicament;
    }

    public function getKardex(int $id): Collection
    {
        Medicament::withTrashed()->findOrFail($id);

        return InventoryMovement::query()
            ->join('batches', 'batches.id', '=', 'inventory_movements.batch_id')
            ->where('batches.medicament_id', $id)
            ->orderByDesc('inventory_movements.occurred_at')
            ->select('inventory_movements.*', 'batches.batch_number')
            ->get();
    }

    public function export(string $format, array $filters = []): Response
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $query = match ($filters['deleted'] ?? 'all') {
            'active'             => Medicament::withoutTrashed(),
            'trashed', 'deleted' => Medicament::onlyTrashed(),
            default              => Medicament::withTrashed(),
        };

        $records = $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Código'        => 'code',
            'Nombre'        => 'name',
            'Concentración' => 'concentration',
            'Precio'        => 'price',
            'Stock Mínimo'  => 'min_stock',
            'Estado'        => 'status',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Medicamentos', 'columns' => $columns, 'records' => $records])->download('medicamentos.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'medicamentos.xlsx');
    }
}
