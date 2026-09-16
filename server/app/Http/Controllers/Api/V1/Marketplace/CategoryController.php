<?php

namespace App\Http\Controllers\Api\V1\Marketplace;

use App\Models\Category;
use App\Traits\ApiResponseTrait;

class CategoryController
{
    use ApiResponseTrait;

    /**
     * Solo categorias que tengan al menos un medicamento activo, para no
     * ensuciar el filtro del marketplace con categorias vacias.
     */
    public function index()
    {
        $categories = Category::query()
            ->whereHas('medicaments', fn ($q) => $q->where('status', 'active'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return $this->resourceResponse($categories, 'Categorías obtenidas con éxito.');
    }
}
