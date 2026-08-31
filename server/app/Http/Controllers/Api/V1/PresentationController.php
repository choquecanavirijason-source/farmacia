<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Presentations\StorePresentationRequest;
use App\Http\Requests\Presentations\UpdatePresentationRequest;
use App\Http\Resources\Presentations\PresentationResource;
use App\Models\Presentation;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PresentationController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Presentation::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(PresentationResource::collection($result), 'Presentaciones obtenidas con éxito.');
    }

    public function store(StorePresentationRequest $request)
    {
        $presentation = Presentation::create($request->validated());

        return $this->createdResponse(new PresentationResource($presentation), 'Presentación registrada con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new PresentationResource(Presentation::withTrashed()->findOrFail($id)), 'Presentación obtenida con éxito.');
    }

    public function update(UpdatePresentationRequest $request, int $id)
    {
        $item = Presentation::withTrashed()->findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new PresentationResource($item->refresh()), 'Presentación actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        Presentation::findOrFail($id)->delete();

        return $this->deletedResponse('Presentación eliminada con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $presentations = Presentation::whereIn('id', (array) $request->ids)->get();
        foreach ($presentations as $presentation) {
            $presentation->delete();
        }

        return $this->deletedResponse('Presentaciones eliminadas con éxito.');
    }

    public function restore(int $id)
    {
        $presentation = Presentation::onlyTrashed()->findOrFail($id);
        $presentation->restore();

        return $this->updatedResponse(new PresentationResource($presentation), 'Presentación restaurada con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Presentation::withTrashed()
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
        ]), 'presentaciones.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Presentaciones',
            'columns' => [
                'Nombre'      => 'name',
                'Descripción' => 'description',
            ],
            'records' => $items,
        ])->download('presentaciones.pdf');
    }
}
