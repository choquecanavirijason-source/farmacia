<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class InvoiceService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'issued_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return Invoice::query()
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Invoice
    {
        return Invoice::create($data);
    }

    public function update(Invoice $invoice, array $data): Invoice
    {
        $invoice->update($data);
        return $invoice->refresh();
    }

    public function delete(int $id): void
    {
        Invoice::findOrFail($id)->delete();
    }

    public function export(string $format): Response
    {
        $items = Invoice::orderByDesc('issued_at')->get();
        $columns = [
            'N° Factura'       => 'invoice_number',
            'NIT/CI Cliente'   => 'client_tax_id',
            'Razón Social'     => 'business_name',
            'Fecha de Emisión' => 'issued_at',
            'Total (Bs)'       => 'total',
            'ID Venta'         => 'sale_id',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Facturación', 'columns' => $columns, 'records' => $items])->download('facturas.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'facturas.xlsx');
    }
}
