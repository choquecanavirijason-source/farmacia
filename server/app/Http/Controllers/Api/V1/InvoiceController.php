<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Invoices\StoreInvoiceRequest;
use App\Http\Requests\Invoices\UpdateInvoiceRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Invoices\InvoiceResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class InvoiceController
{
    use ApiResponseTrait;

    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->invoiceService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('issued_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(InvoiceResource::collection($result), 'Facturas obtenidas con éxito.');
    }

    public function store(StoreInvoiceRequest $request)
    {
        $invoice = $this->invoiceService->create($request->validated());
        return $this->createdResponse(new InvoiceResource($invoice), 'Factura emitida con éxito.');
    }

    public function show(int $id)
    {
        $invoice = Invoice::findOrFail($id);
        return $this->resourceResponse(new InvoiceResource($invoice), 'Factura obtenida con éxito.');
    }

    public function update(UpdateInvoiceRequest $request, int $id)
    {
        $invoice = Invoice::findOrFail($id);
        $updatedInvoice = $this->invoiceService->update($invoice, $request->validated());
        return $this->updatedResponse(new InvoiceResource($updatedInvoice), 'Factura actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->invoiceService->delete($id);
        return $this->deletedResponse('Factura eliminada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->invoiceService->export($format);
    }
}
