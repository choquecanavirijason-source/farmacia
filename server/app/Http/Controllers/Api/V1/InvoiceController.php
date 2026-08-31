<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Invoices\StoreInvoiceRequest;
use App\Http\Requests\Invoices\UpdateInvoiceRequest;
use App\Http\Resources\Invoices\InvoiceResource;
use App\Models\Invoice;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class InvoiceController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $invoices = Invoice::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'issued_at'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(InvoiceResource::collection($invoices), 'Facturas obtenidas con éxito.');
    }

    public function store(StoreInvoiceRequest $request)
    {
        $invoice = Invoice::create($request->validated());

        return $this->createdResponse(new InvoiceResource($invoice), 'Factura emitida con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new InvoiceResource(Invoice::findOrFail($id)), 'Factura obtenida con éxito.');
    }

    public function update(UpdateInvoiceRequest $request, int $id)
    {
        $item = Invoice::findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new InvoiceResource($item->refresh()), 'Factura actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        Invoice::findOrFail($id)->delete();

        return $this->deletedResponse('Factura eliminada con éxito.');
    }

    public function export(Request $request)
    {
        $items = Invoice::orderByDesc('issued_at')->get();
        $c = ['Invoice number' => 'invoice_number', 'Client tax ID' => 'client_tax_id', 'Business name' => 'business_name', 'Issued at' => 'issued_at', 'Total' => 'total', 'Sale' => 'sale_id'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Invoices', 'columns' => $c, 'records' => $items])->download('invoices.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'invoices.xlsx');
    }
}
