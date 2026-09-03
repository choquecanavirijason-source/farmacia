<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Http\Requests\Purchases\UpdatePurchaseRequest;
use App\Http\Resources\Purchases\PurchaseResource;
use App\Models\Purchase;
use App\Services\PurchaseService;
use App\Traits\ApiResponseTrait;
use App\Traits\ResolvesBranchScope;
use Illuminate\Http\Request;

class PurchaseController
{
    use ApiResponseTrait, ResolvesBranchScope;

    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['search', 'supplier_id', 'start_date', 'end_date']);
        $filters['branch_id'] = $this->resolveBranchScope($request);

        $result = $this->purchaseService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('purchase_date'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(PurchaseResource::collection($result), 'Compras obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $purchase = $this->purchaseService->getById($id);
        return $this->resourceResponse(new PurchaseResource($purchase), 'Compra obtenida con éxito.');
    }

    public function store(StorePurchaseRequest $request)
    {
        $data = $request->validated();
        $data['branch_id'] = $request->user()->active_branch_id;

        $purchase = $this->purchaseService->create($data);
        return $this->createdResponse(
            new PurchaseResource($purchase->load(['supplier', 'details.medicament'])),
            'Compra registrada con éxito y lotes ingresados al inventario.'
        );
    }

    public function update(UpdatePurchaseRequest $request, int $id)
    {
        $purchase = Purchase::findOrFail($id);
        $updatedPurchase = $this->purchaseService->update($purchase, $request->validated());
        return $this->updatedResponse(new PurchaseResource($updatedPurchase), 'Compra actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->purchaseService->delete($id);
        return $this->deletedResponse('Compra eliminada con éxito.');
    }

    public function details(int $id)
    {
        $details = $this->purchaseService->getDetails($id);
        return $this->successResponse($details, 'Detalle de la compra obtenido con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->purchaseService->export($format);
    }
}
