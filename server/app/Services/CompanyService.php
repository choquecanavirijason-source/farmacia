<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Company;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class CompanyService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return Company::query()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function getCurrent(): Company
    {
        return Company::firstOrCreate(
            ['id' => 1],
            [
                'name'    => 'Farmacia Juan de Dios',
                'nit'     => '1028374029',
                'address' => 'Av. Principal #123',
                'phone'   => '71234567',
                'email'   => 'contacto@farmacia.com',
            ]
        );
    }

    public function updateCurrent(array $data): Company
    {
        $company = Company::firstOrCreate(['id' => 1]);
        $company->update($data);
        return $company->refresh();
    }

    public function create(array $data): Company
    {
        return Company::create($data);
    }

    public function update(Company $company, array $data): Company
    {
        $company->update($data);
        return $company->refresh();
    }

    public function delete(int $id): void
    {
        Company::findOrFail($id)->delete();
    }

    public function export(string $format): Response
    {
        $items = Company::orderBy('name')->get();
        $columns = [
            'Nombre / Razón Social' => 'name',
            'NIT'                   => 'nit',
            'Dirección'             => 'address',
            'Teléfono'              => 'phone',
            'Email'                 => 'email',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Datos de la Empresa', 'columns' => $columns, 'records' => $items])->download('empresa.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'empresa.xlsx');
    }
}
