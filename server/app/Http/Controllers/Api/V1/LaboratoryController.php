<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Laboratories\StoreLaboratoryRequest;
use App\Http\Requests\Laboratories\UpdateLaboratoryRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Laboratories\LaboratoryResource;
use App\Models\Laboratory;
use App\Services\LaboratoryService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class LaboratoryController
{
    use ApiResponseTrait;

    public function __construct(
        protected LaboratoryService $laboratoryService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->laboratoryService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc'),
            (string) $request->query('status', 'active')
        );

        return $this->collectionResponse(LaboratoryResource::collection($result), 'Laboratorios obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $laboratory = Laboratory::withTrashed()->findOrFail($id);
        return $this->resourceResponse(new LaboratoryResource($laboratory), 'Laboratorio obtenido con éxito.');
    }

    public function store(StoreLaboratoryRequest $request)
    {
        $laboratory = $this->laboratoryService->create($request->validated());
        return $this->createdResponse(new LaboratoryResource($laboratory), 'Laboratorio registrado con éxito.');
    }

    public function update(UpdateLaboratoryRequest $request, int $id)
    {
        $laboratory = Laboratory::withTrashed()->findOrFail($id);
        $updatedLaboratory = $this->laboratoryService->update($laboratory, $request->validated());
        return $this->updatedResponse(new LaboratoryResource($updatedLaboratory), 'Laboratorio actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->laboratoryService->delete($id);
        return $this->deletedResponse('Laboratorio eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->laboratoryService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Laboratorios eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $laboratory = $this->laboratoryService->restore($id);
        return $this->updatedResponse(new LaboratoryResource($laboratory), 'Laboratorio restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $search = trim((string) $request->query('search'));
        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDir = (string) $request->query('sort_dir', 'asc');
        $status = (string) $request->query('status', 'all');

        return $this->laboratoryService->export($format, $search, $sortBy, $sortDir, $status);
    }
}
