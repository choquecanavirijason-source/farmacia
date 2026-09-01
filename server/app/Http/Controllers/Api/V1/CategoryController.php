<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Categories\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class CategoryController
{
    use ApiResponseTrait;

    public function __construct(
        protected CategoryService $categoryService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->categoryService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(CategoryResource::collection($result), 'Categorías obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        return $this->resourceResponse(new CategoryResource($category), 'Categoría obtenida con éxito.');
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = $this->categoryService->create($request->validated());
        return $this->createdResponse(new CategoryResource($category), 'Categoría creada con éxito.');
    }

    public function update(UpdateCategoryRequest $request, int $id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        $updatedCategory = $this->categoryService->update($category, $request->validated());
        return $this->updatedResponse(new CategoryResource($updatedCategory), 'Categoría actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->categoryService->delete($id);
        return $this->deletedResponse('Categoría eliminada con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->categoryService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Categorías eliminadas con éxito.');
    }

    public function restore(int $id)
    {
        $category = $this->categoryService->restore($id);
        return $this->updatedResponse(new CategoryResource($category), 'Categoría restaurada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $search = trim((string) $request->query('search'));
        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDir = (string) $request->query('sort_dir', 'asc');

        return $this->categoryService->export($format, $search, $sortBy, $sortDir);
    }
}
