<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Companies\StoreCompanyRequest;
use App\Http\Requests\Companies\UpdateCompanyRequest;
use App\Http\Resources\Companies\CompanyResource;
use App\Models\Company;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        return CompanyResource::collection(Company::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StoreCompanyRequest $request)
    {
        return (new CompanyResource(Company::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new CompanyResource(Company::findOrFail($id));
    }

    public function update(UpdateCompanyRequest $request, int $id)
    {
        $item = Company::findOrFail($id);
        $item->update($request->validated());

        return new CompanyResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Company::findOrFail($id)->delete();

        return response()->json(['message' => 'Company deleted.']);
    }

    public function export(Request $request)
    {
        $items = Company::orderBy('name')->get();
        $c = ['Name' => 'name', 'NIT' => 'nit', 'Address' => 'address', 'Phone' => 'phone', 'Email' => 'email'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Companies', 'columns' => $c, 'records' => $items])->download('companies.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'companies.xlsx');
    }
}
