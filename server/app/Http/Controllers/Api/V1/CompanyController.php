<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Companies\StoreCompanyRequest;
use App\Http\Requests\Companies\UpdateCompanyRequest;
use App\Http\Resources\Companies\CompanyResource;
use App\Models\Company;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class CompanyController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $companies = Company::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(CompanyResource::collection($companies), 'Empresas obtenidas con éxito.');
    }

    public function store(StoreCompanyRequest $request)
    {
        $company = Company::create($request->validated());

        return $this->createdResponse(new CompanyResource($company), 'Empresa registrada con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new CompanyResource(Company::findOrFail($id)), 'Empresa obtenida con éxito.');
    }

    public function update(UpdateCompanyRequest $request, int $id)
    {
        $item = Company::findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new CompanyResource($item->refresh()), 'Empresa actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        Company::findOrFail($id)->delete();

        return $this->deletedResponse('Empresa eliminada con éxito.');
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
