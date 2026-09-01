<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class SupplierService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return Supplier::withTrashed()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);
        return $supplier->refresh();
    }

    public function delete(int $id): void
    {
        Supplier::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $suppliers = Supplier::whereIn('id', $ids)->get();
        foreach ($suppliers as $supplier) {
            $supplier->delete();
        }
        return $suppliers->count();
    }

    public function restore(int $id): Supplier
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);
        $supplier->restore();
        return $supplier;
    }

    public function export(string $format, string $search = '', string $sortBy = 'name', string $sortDir = 'asc'): Response
    {
        $records = Supplier::withTrashed()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Nombre'    => 'name',
            'NIT'       => 'nit',
            'Teléfono'  => 'phone',
            'Dirección' => 'address',
            'Email'     => 'email',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Proveedores', 'columns' => $columns, 'records' => $records])->download('proveedores.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'proveedores.xlsx');
    }
}
