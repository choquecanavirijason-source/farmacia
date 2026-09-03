<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Medicaments\StoreMedicamentRequest;
use App\Http\Requests\Medicaments\UpdateMedicamentRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Medicaments\MedicamentResource;
use App\Models\Medicament;
use App\Services\MedicamentService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class MedicamentController
{
    use ApiResponseTrait;

    public function __construct(
        protected MedicamentService $medicamentService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['search', 'status', 'category_id', 'laboratory_id']);
        $filters['deleted'] = $request->query('deleted', 'active');

        $result = $this->medicamentService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(MedicamentResource::collection($result), 'Medicamentos obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $medicament = $this->medicamentService->getById($id);
        return $this->resourceResponse(new MedicamentResource($medicament), 'Medicamento obtenido con éxito.');
    }

    public function store(StoreMedicamentRequest $request)
    {
        $medicament = $this->medicamentService->create($request->validated());
        return $this->createdResponse(new MedicamentResource($medicament), 'Medicamento registrado con éxito.');
    }

    public function update(UpdateMedicamentRequest $request, int $id)
    {
        $medicament = Medicament::withTrashed()->findOrFail($id);
        $updatedMedicament = $this->medicamentService->update($medicament, $request->validated());
        return $this->updatedResponse(new MedicamentResource($updatedMedicament), 'Medicamento actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->medicamentService->delete($id);
        return $this->deletedResponse('Medicamento eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->medicamentService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Medicamentos eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $medicament = $this->medicamentService->restore($id);
        return $this->updatedResponse(new MedicamentResource($medicament), 'Medicamento restaurado con éxito.');
    }

    public function kardex(int $id)
    {
        $movements = $this->medicamentService->getKardex($id);
        return $this->successResponse($movements, 'Kardex del medicamento obtenido con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = $request->only(['search', 'status', 'category_id', 'laboratory_id', 'sort_by', 'sort_dir']);
        $filters['deleted'] = $request->query('deleted', 'all');

        return $this->medicamentService->export($format, $filters);
    }
}
