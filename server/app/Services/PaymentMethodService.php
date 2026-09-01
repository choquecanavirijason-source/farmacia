<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\PaymentMethod;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class PaymentMethodService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        return PaymentMethod::query()
            ->when(!empty($filters['search']), fn ($q) => $q->search((string) $filters['search']))
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): PaymentMethod
    {
        return PaymentMethod::create($data);
    }

    public function update(PaymentMethod $paymentMethod, array $data): PaymentMethod
    {
        $paymentMethod->update($data);
        return $paymentMethod->refresh();
    }

    public function delete(int $id): void
    {
        PaymentMethod::findOrFail($id)->delete();
    }

    public function export(string $format): Response
    {
        $items = PaymentMethod::orderBy('name')->get();
        $columns = [
            'Nombre' => 'name',
            'Estado' => 'status',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Métodos de Pago', 'columns' => $columns, 'records' => $items])->download('metodos_pago.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'metodos_pago.xlsx');
    }
}
