<?php

namespace App\Http\Controllers\Api\V1\Marketplace;

use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Marketplace\ProductResource;
use App\Models\Medicament;
use App\Traits\ApiResponseTrait;

class ProductController
{
    use ApiResponseTrait;

    /**
     * Catalogo publico: solo medicamentos activos, con el stock sumado de
     * todas las sucursales (no requiere sesion iniciada).
     */
    public function index(PaginationRequest $request)
    {
        $search = $request->getSearch();

        $query = Medicament::query()
            ->where('status', 'active')
            ->with(['category', 'presentation', 'laboratory'])
            ->withSum('batches as total_stock', 'current_quantity')
            ->when($search !== '', fn ($q) => $q->search($search))
            ->when($request->query('category_id'), fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->sort($request->getSortBy('name'), $request->getSortDir('asc'));

        $result = $query->paginate($request->getPerPage(20));

        return $this->collectionResponse(ProductResource::collection($result), 'Productos obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $medicament = Medicament::query()
            ->where('status', 'active')
            ->with(['category', 'presentation', 'laboratory'])
            ->withSum('batches as total_stock', 'current_quantity')
            ->findOrFail($id);

        return $this->resourceResponse(new ProductResource($medicament), 'Producto obtenido con éxito.');
    }
}
