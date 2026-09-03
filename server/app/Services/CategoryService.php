<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Category;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class CategoryService
{
    public function getPaginated(string $search = '', int $perPage = 10, string $sortBy = 'name', string $sortDir = 'asc', string $status = 'active'): LengthAwarePaginator
    {
        $query = match ($status) {
            'active'             => Category::withoutTrashed(),
            'trashed', 'deleted' => Category::onlyTrashed(),
            default              => Category::withTrashed(),
        };

        return $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        $category->update($data);
        return $category->refresh();
    }

    public function delete(int $id): void
    {
        Category::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $categories = Category::whereIn('id', $ids)->get();
        foreach ($categories as $category) {
            $category->delete();
        }
        return $categories->count();
    }

    public function restore(int $id): Category
    {
        $category = Category::onlyTrashed()->findOrFail($id);
        $category->restore();
        return $category;
    }

    public function export(string $format, string $search = '', string $sortBy = 'name', string $sortDir = 'asc', string $status = 'all'): Response
    {
        $query = match ($status) {
            'active'             => Category::withoutTrashed(),
            'trashed', 'deleted' => Category::onlyTrashed(),
            default              => Category::withTrashed(),
        };

        $records = $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Nombre'      => 'name',
            'Descripción' => 'description',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Categorías', 'columns' => $columns, 'records' => $records])->download('categorias.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'categorias.xlsx');
    }
}
