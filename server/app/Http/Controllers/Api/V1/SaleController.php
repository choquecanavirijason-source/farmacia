<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Sales\StoreSaleRequest;
use App\Http\Requests\Sales\UpdateSaleRequest;
use App\Http\Resources\Sales\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class SaleController
{
    use ApiResponseTrait;

    public function __construct(
        protected SaleService $saleService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['status', 'client_id', 'start_date', 'end_date', 'search']);

        $result = $this->saleService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('sold_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(SaleResource::collection($result), 'Ventas obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $sale = $this->saleService->getById($id);
        return $this->resourceResponse(new SaleResource($sale), 'Venta obtenida con éxito.');
    }

    public function store(StoreSaleRequest $request)
    {
        $saleData = $this->saleService->create($request->validated(), $request->user());
        return $this->createdResponse($saleData, 'Venta registrada con éxito con factura y movimientos de caja/inventario.');
    }

    public function update(UpdateSaleRequest $request, int $id)
    {
        $sale = Sale::findOrFail($id);
        $updatedSale = $this->saleService->update($sale, $request->validated());
        return $this->updatedResponse(new SaleResource($updatedSale), 'Venta actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->saleService->delete($id);
        return $this->deletedResponse('Venta eliminada con éxito.');
    }

    public function details(int $id)
    {
        $details = $this->saleService->getDetails($id);
        return $this->successResponse($details, 'Detalle de la venta obtenido con éxito.');
    }

    public function invoice(int $id)
    {
        $invoice = $this->saleService->getInvoice($id);
        return $this->successResponse($invoice, 'Factura de la venta obtenida con éxito.');
    }

    public function void(int $id)
    {
        $voidedData = $this->saleService->void($id);
        return $this->successResponse($voidedData, 'Venta anulada con éxito y stock restaurado.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->saleService->export($format);
    }
}
