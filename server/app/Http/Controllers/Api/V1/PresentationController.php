<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Presentations\StorePresentationRequest;
use App\Http\Requests\Presentations\UpdatePresentationRequest;
use App\Http\Resources\Presentations\PresentationResource;
use App\Models\Presentation;
use App\Services\PresentationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class PresentationController
{
    use ApiResponseTrait;

    public function __construct(
        protected PresentationService $presentationService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->presentationService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc'),
            (string) $request->query('status', 'active')
        );

        return $this->collectionResponse(PresentationResource::collection($result), 'Presentaciones obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $presentation = Presentation::withTrashed()->findOrFail($id);
        return $this->resourceResponse(new PresentationResource($presentation), 'Presentación obtenida con éxito.');
    }

    public function store(StorePresentationRequest $request)
    {
        $presentation = $this->presentationService->create($request->validated());
        return $this->createdResponse(new PresentationResource($presentation), 'Presentación registrada con éxito.');
    }

    public function update(UpdatePresentationRequest $request, int $id)
    {
        $presentation = Presentation::withTrashed()->findOrFail($id);
        $updatedPresentation = $this->presentationService->update($presentation, $request->validated());
        return $this->updatedResponse(new PresentationResource($updatedPresentation), 'Presentación actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->presentationService->delete($id);
        return $this->deletedResponse('Presentación eliminada con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->presentationService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Presentaciones eliminadas con éxito.');
    }

    public function restore(int $id)
    {
        $presentation = $this->presentationService->restore($id);
        return $this->updatedResponse(new PresentationResource($presentation), 'Presentación restaurada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $search = trim((string) $request->query('search'));
        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDir = (string) $request->query('sort_dir', 'asc');
        $status = (string) $request->query('status', 'all');

        return $this->presentationService->export($format, $search, $sortBy, $sortDir, $status);
    }
}
