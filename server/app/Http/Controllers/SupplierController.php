<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Http\Resources\Suppliers\SupplierResource;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();
        if ($search = trim((string) $request->query('search'))) {
            $query->search($search);
        }

        return SupplierResource::collection($query->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StoreSupplierRequest $request)
    {
        return (new SupplierResource(Supplier::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new SupplierResource(Supplier::findOrFail($id));
    }

    public function update(UpdateSupplierRequest $request, int $id)
    {
        $item = Supplier::findOrFail($id);
        $item->update($request->validated());

        return new SupplierResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Supplier::findOrFail($id)->delete();

        return response()->json(['message' => 'Supplier deleted.']);
    }

    public function export(Request $request)
    {
        $items = Supplier::orderBy('name')->get();
        $c = ['Name' => 'name', 'NIT' => 'nit', 'Phone' => 'phone', 'Address' => 'address', 'Email' => 'email'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Suppliers', 'columns' => $c, 'records' => $items])->download('suppliers.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'suppliers.xlsx');
    }
}
