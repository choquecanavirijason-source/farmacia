<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Presentation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class PresentationService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return Presentation::withTrashed()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Presentation
    {
        return Presentation::create($data);
    }

    public function update(Presentation $presentation, array $data): Presentation
    {
        $presentation->update($data);
        return $presentation->refresh();
    }

    public function delete(int $id): void
    {
        Presentation::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $presentations = Presentation::whereIn('id', $ids)->get();
        foreach ($presentations as $presentation) {
            $presentation->delete();
        }
        return $presentations->count();
    }

    public function restore(int $id): Presentation
    {
        $presentation = Presentation::onlyTrashed()->findOrFail($id);
        $presentation->restore();
        return $presentation;
    }

    public function export(string $format, string $search = '', string $sortBy = 'name', string $sortDir = 'asc'): Response
    {
        $records = Presentation::withTrashed()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Nombre' => 'name',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Presentaciones', 'columns' => $columns, 'records' => $records])->download('presentaciones.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'presentaciones.xlsx');
    }
}
