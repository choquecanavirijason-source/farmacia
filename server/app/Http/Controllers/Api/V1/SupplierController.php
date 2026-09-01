<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Http\Resources\Suppliers\SupplierResource;
use App\Models\Supplier;
use App\Services\SupplierService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class SupplierController
{
    use ApiResponseTrait;

    public function __construct(
        protected SupplierService $supplierService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->supplierService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(SupplierResource::collection($result), 'Proveedores obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $supplier = Supplier::withTrashed()->findOrFail($id);
        return $this->resourceResponse(new SupplierResource($supplier), 'Proveedor obtenido con éxito.');
    }

    public function store(StoreSupplierRequest $request)
    {
        $supplier = $this->supplierService->create($request->validated());
        return $this->createdResponse(new SupplierResource($supplier), 'Proveedor registrado con éxito.');
    }

    public function update(UpdateSupplierRequest $request, int $id)
    {
        $supplier = Supplier::withTrashed()->findOrFail($id);
        $updatedSupplier = $this->supplierService->update($supplier, $request->validated());
        return $this->updatedResponse(new SupplierResource($updatedSupplier), 'Proveedor actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->supplierService->delete($id);
        return $this->deletedResponse('Proveedor eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->supplierService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Proveedores eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $supplier = $this->supplierService->restore($id);
        return $this->updatedResponse(new SupplierResource($supplier), 'Proveedor restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $search = trim((string) $request->query('search'));
        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDir = (string) $request->query('sort_dir', 'asc');

        return $this->supplierService->export($format, $search, $sortBy, $sortDir);
    }
}
