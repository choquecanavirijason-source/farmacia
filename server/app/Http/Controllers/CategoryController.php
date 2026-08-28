<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Resources\Categories\CategoryResource;
use App\Models\Category;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')));

        return CategoryResource::collection($query->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StoreCategoryRequest $request)
    {
        return (new CategoryResource(Category::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new CategoryResource(Category::findOrFail($id));
    }

    public function update(UpdateCategoryRequest $request, int $id)
    {
        $item = Category::findOrFail($id);
        $item->update($request->validated());

        return new CategoryResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Category::findOrFail($id)->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    public function export(Request $request)
    {
        $items = Category::query()->orderBy('name')->get();

        return $this->exportFile($items);
    }

    private function exportFile($items)
    {
        $columns = ['Name' => 'name', 'Description' => 'description'];
        if (request('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Categories', 'columns' => $columns, 'records' => $items])->download('categories.pdf');
        }

        return Excel::download(new RecordsExport($items, $columns), 'categories.xlsx');
    }
}
