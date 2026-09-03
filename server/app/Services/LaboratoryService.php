<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Laboratory;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class LaboratoryService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc', string $status = 'active'): LengthAwarePaginator
    {
        $query = match ($status) {
            'active'             => Laboratory::withoutTrashed(),
            'trashed', 'deleted' => Laboratory::onlyTrashed(),
            default              => Laboratory::withTrashed(),
        };

        return $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Laboratory
    {
        return Laboratory::create($data);
    }

    public function update(Laboratory $laboratory, array $data): Laboratory
    {
        $laboratory->update($data);
        return $laboratory->refresh();
    }

    public function delete(int $id): void
    {
        Laboratory::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $laboratories = Laboratory::whereIn('id', $ids)->get();
        foreach ($laboratories as $laboratory) {
            $laboratory->delete();
        }
        return $laboratories->count();
    }

    public function restore(int $id): Laboratory
    {
        $laboratory = Laboratory::onlyTrashed()->findOrFail($id);
        $laboratory->restore();
        return $laboratory;
    }

    public function export(string $format, string $search = '', string $sortBy = 'name', string $sortDir = 'asc', string $status = 'all'): Response
    {
        $query = match ($status) {
            'active'             => Laboratory::withoutTrashed(),
            'trashed', 'deleted' => Laboratory::onlyTrashed(),
            default              => Laboratory::withTrashed(),
        };

        $records = $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Nombre' => 'name',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Laboratorios', 'columns' => $columns, 'records' => $records])->download('laboratorios.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'laboratorios.xlsx');
    }
}
