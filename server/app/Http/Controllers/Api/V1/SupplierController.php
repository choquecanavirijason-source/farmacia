<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Http\Resources\Suppliers\SupplierResource;
use App\Models\Supplier;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class SupplierController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Supplier::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(SupplierResource::collection($result), 'Proveedores obtenidos con éxito.');
    }

    public function store(StoreSupplierRequest $request)
    {
        $supplier = Supplier::create($request->validated());

        return $this->createdResponse(new SupplierResource($supplier), 'Proveedor registrado con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new SupplierResource(Supplier::withTrashed()->findOrFail($id)), 'Proveedor obtenido con éxito.');
    }

    public function update(UpdateSupplierRequest $request, int $id)
    {
        $item = Supplier::withTrashed()->findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new SupplierResource($item->refresh()), 'Proveedor actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        Supplier::findOrFail($id)->delete();

        return $this->deletedResponse('Proveedor eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $suppliers = Supplier::whereIn('id', (array) $request->ids)->get();
        foreach ($suppliers as $supplier) {
            $supplier->delete();
        }

        return $this->deletedResponse('Proveedores eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);
        $supplier->restore();

        return $this->updatedResponse(new SupplierResource($supplier), 'Proveedor restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Supplier::withTrashed()
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
            'Nombre'    => 'name',
            'NIT'       => 'nit',
            'Teléfono'  => 'phone',
            'Dirección' => 'address',
            'Email'     => 'email',
        ]), 'proveedores.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Proveedores',
            'columns' => [
                'Nombre'    => 'name',
                'NIT'       => 'nit',
                'Teléfono'  => 'phone',
                'Dirección' => 'address',
                'Email'     => 'email',
            ],
            'records' => $items,
        ])->download('proveedores.pdf');
    }
}
