<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Companies\StoreCompanyRequest;
use App\Http\Requests\Companies\UpdateCompanyRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Companies\CompanyResource;
use App\Models\Company;
use App\Services\CompanyService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class CompanyController
{
    use ApiResponseTrait;

    public function __construct(
        protected CompanyService $companyService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->companyService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(CompanyResource::collection($result), 'Empresas obtenidas con éxito.');
    }

    public function current()
    {
        $company = $this->companyService->getCurrent();
        return $this->resourceResponse(new CompanyResource($company), 'Datos de la empresa obtenidos con éxito.');
    }

    public function updateCurrent(UpdateCompanyRequest $request)
    {
        $company = $this->companyService->updateCurrent($request->validated());
        return $this->updatedResponse(new CompanyResource($company), 'Datos de la empresa actualizados con éxito.');
    }

    public function store(StoreCompanyRequest $request)
    {
        $company = $this->companyService->create($request->validated());
        return $this->createdResponse(new CompanyResource($company), 'Empresa registrada con éxito.');
    }

    public function show(int $id)
    {
        $company = Company::findOrFail($id);
        return $this->resourceResponse(new CompanyResource($company), 'Empresa obtenida con éxito.');
    }

    public function update(UpdateCompanyRequest $request, int $id)
    {
        $company = Company::findOrFail($id);
        $updatedCompany = $this->companyService->update($company, $request->validated());
        return $this->updatedResponse(new CompanyResource($updatedCompany), 'Empresa actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->companyService->delete($id);
        return $this->deletedResponse('Empresa eliminada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->companyService->export($format);
    }
}
