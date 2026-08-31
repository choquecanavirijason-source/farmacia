<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Laboratories\StoreLaboratoryRequest;
use App\Http\Requests\Laboratories\UpdateLaboratoryRequest;
use App\Http\Resources\Laboratories\LaboratoryResource;
use App\Models\Laboratory;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class LaboratoryController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Laboratory::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(LaboratoryResource::collection($result), 'Laboratorios obtenidos con éxito.');
    }

    public function store(StoreLaboratoryRequest $request)
    {
        $laboratory = Laboratory::create($request->validated());

        return $this->createdResponse(new LaboratoryResource($laboratory), 'Laboratorio registrado con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new LaboratoryResource(Laboratory::withTrashed()->findOrFail($id)), 'Laboratorio obtenido con éxito.');
    }

    public function update(UpdateLaboratoryRequest $request, int $id)
    {
        $item = Laboratory::withTrashed()->findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new LaboratoryResource($item->refresh()), 'Laboratorio actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        Laboratory::findOrFail($id)->delete();

        return $this->deletedResponse('Laboratorio eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $laboratories = Laboratory::whereIn('id', (array) $request->ids)->get();
        foreach ($laboratories as $laboratory) {
            $laboratory->delete();
        }

        return $this->deletedResponse('Laboratorios eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $laboratory = Laboratory::onlyTrashed()->findOrFail($id);
        $laboratory->restore();

        return $this->updatedResponse(new LaboratoryResource($laboratory), 'Laboratorio restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Laboratory::withTrashed()
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
            'Nombre'   => 'name',
            'País'     => 'country',
            'Teléfono' => 'phone',
        ]), 'laboratorios.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Laboratorios',
            'columns' => [
                'Nombre'   => 'name',
                'País'     => 'country',
                'Teléfono' => 'phone',
            ],
            'records' => $items,
        ])->download('laboratorios.pdf');
    }
}
