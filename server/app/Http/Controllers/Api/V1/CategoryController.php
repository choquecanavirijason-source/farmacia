<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Resources\Categories\CategoryResource;
use App\Models\Category;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class CategoryController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Category::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(CategoryResource::collection($result), 'Categorías obtenidas con éxito.');
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return $this->createdResponse(new CategoryResource($category), 'Categoría creada con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new CategoryResource(Category::withTrashed()->findOrFail($id)), 'Categoría obtenida con éxito.');
    }

    public function update(UpdateCategoryRequest $request, int $id)
    {
        $item = Category::withTrashed()->findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new CategoryResource($item->refresh()), 'Categoría actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        Category::findOrFail($id)->delete();

        return $this->deletedResponse('Categoría eliminada con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $categories = Category::whereIn('id', (array) $request->ids)->get();
        foreach ($categories as $category) {
            $category->delete();
        }

        return $this->deletedResponse('Categorías eliminadas con éxito.');
    }

    public function restore(int $id)
    {
        $category = Category::onlyTrashed()->findOrFail($id);
        $category->restore();

        return $this->updatedResponse(new CategoryResource($category), 'Categoría restaurada con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Category::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->get();

        return strtolower((string) $request->query('format', 'excel')) === 'pdf'
            ? $this->exportPdf($items)
            : $this->exportExcel($items);
    }

    private function exportExcel($items)
    {
        return Excel::download(new RecordsExport($items, [
            'Nombre'      => 'name',
            'Descripción' => 'description',
        ]), 'categorias.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Categorías',
            'columns' => [
                'Nombre'      => 'name',
                'Descripción' => 'description',
            ],
            'records' => $items,
        ])->download('categorias.pdf');
    }
}
