<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Medicaments\StoreMedicamentRequest;
use App\Http\Requests\Medicaments\UpdateMedicamentRequest;
use App\Http\Resources\Medicaments\MedicamentResource;
use App\Models\InventoryMovement;
use App\Models\Medicament;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class MedicamentController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Medicament::withTrashed()
            ->with(['category', 'presentation', 'laboratory'])
            ->when($search !== '', fn ($query) => $query->search($search))
            ->filter($request->only(['status', 'category_id']))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(MedicamentResource::collection($result), 'Medicamentos obtenidos con éxito.');
    }

    public function store(StoreMedicamentRequest $request)
    {
        $medicament = Medicament::create($request->validated());

        return $this->createdResponse(new MedicamentResource($medicament), 'Medicamento registrado con éxito.');
    }

    public function show(int $id)
    {
        $medicament = Medicament::withTrashed()
            ->with(['category', 'presentation', 'laboratory'])
            ->findOrFail($id);

        return $this->resourceResponse(new MedicamentResource($medicament), 'Medicamento obtenido con éxito.');
    }

    public function update(UpdateMedicamentRequest $request, int $id)
    {
        $item = Medicament::withTrashed()->findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new MedicamentResource($item->refresh()), 'Medicamento actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        Medicament::findOrFail($id)->delete();

        return $this->deletedResponse('Medicamento eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $medicaments = Medicament::whereIn('id', (array) $request->ids)->get();
        foreach ($medicaments as $medicament) {
            $medicament->delete();
        }

        return $this->deletedResponse('Medicamentos eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $medicament = Medicament::onlyTrashed()->findOrFail($id);
        $medicament->restore();

        return $this->updatedResponse(new MedicamentResource($medicament), 'Medicamento restaurado con éxito.');
    }

    public function kardex(int $id)
    {
        Medicament::withTrashed()->findOrFail($id);

        $movements = InventoryMovement::query()
            ->join('batches', 'batches.id', '=', 'inventory_movements.batch_id')
            ->where('batches.medicament_id', $id)
            ->orderByDesc('inventory_movements.occurred_at')
            ->select('inventory_movements.*', 'batches.batch_number')
            ->get();

        return $this->successResponse($movements, 'Kardex del medicamento obtenido con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Medicament::withTrashed()
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
            'Código'        => 'code',
            'Nombre'        => 'name',
            'Concentración' => 'concentration',
            'Precio'        => 'price',
            'Stock Mínimo'  => 'min_stock',
            'Estado'        => 'status',
        ]), 'medicamentos.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Medicamentos',
            'columns' => [
                'Código'        => 'code',
                'Nombre'        => 'name',
                'Concentración' => 'concentration',
                'Precio'        => 'price',
                'Stock Mínimo'  => 'min_stock',
                'Estado'        => 'status',
            ],
            'records' => $items,
        ])->download('medicamentos.pdf');
    }
}
