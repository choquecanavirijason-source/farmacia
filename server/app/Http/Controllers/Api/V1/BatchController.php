<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Batches\StoreBatchRequest;
use App\Http\Requests\Batches\UpdateBatchRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Batches\BatchResource;
use App\Models\Batch;
use App\Services\BatchService;
use App\Traits\ApiResponseTrait;
use App\Traits\ResolvesBranchScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BatchController
{
    use ApiResponseTrait, ResolvesBranchScope;

    public function __construct(
        protected BatchService $batchService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = [
            'search'    => $request->getSearch(),
            'branch_id' => $this->resolveBranchScope($request),
            'status'    => $request->query('status', 'active'),
        ];

        $result = $this->batchService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('expiration_date'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(BatchResource::collection($result), 'Lotes obtenidos con éxito.');
    }

    public function store(StoreBatchRequest $request)
    {
        $data = $request->validated();
        $data['branch_id'] = $request->user()->active_branch_id;

        $batch = $this->batchService->create($data);
        return $this->createdResponse(new BatchResource($batch), 'Lote registrado con éxito con su movimiento inicial.');
    }

    public function show(int $id)
    {
        $batch = Batch::withTrashed()->with('medicament')->findOrFail($id);
        return $this->resourceResponse(new BatchResource($batch), 'Lote obtenido con éxito.');
    }

    public function update(UpdateBatchRequest $request, int $id)
    {
        $batch = Batch::withTrashed()->findOrFail($id);
        $updatedBatch = $this->batchService->update($batch, $request->validated());
        return $this->updatedResponse(new BatchResource($updatedBatch), 'Lote actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->batchService->delete($id);
        return $this->deletedResponse('Lote eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->batchService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Lotes eliminados con éxito.');
    }

    public function kardex(int $id)
    {
        $movements = $this->batchService->getKardex($id);
        return $this->successResponse($movements, 'Movimientos de kardex del lote obtenidos con éxito.');
    }

    public function sell(Request $request, int $id)
    {
        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo'   => ['required', 'string', 'max:150'],
        ]);

        $batch = $this->batchService->moveStock($id, (int) $data['cantidad'], $data['motivo'], 'out', -1);
        return $this->successResponse(new BatchResource($batch), 'Salida de stock del lote realizada con éxito.');
    }

    public function restore(Request $request, int $id)
    {
        if ($request->filled('cantidad')) {
            $data = $request->validate([
                'cantidad' => ['required', 'integer', 'min:1'],
                'motivo'   => ['required', 'string', 'max:150'],
            ]);
            $batch = $this->batchService->moveStock($id, (int) $data['cantidad'], $data['motivo'], 'in', 1);
            return $this->successResponse(new BatchResource($batch), 'Restauración de stock del lote realizada con éxito.');
        }

        $batch = $this->batchService->restore($id);
        return $this->updatedResponse(new BatchResource($batch), 'Lote restaurado con éxito.');
    }

    public function dispose(Request $request, int $id)
    {
        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo'   => ['required', Rule::in(['Vencimiento', 'Daño', 'Extravío', 'Otro'])],
        ]);

        $batch = $this->batchService->dispose($id, (int) $data['cantidad'], $data['motivo'], (int) $request->user()->id);
        return $this->successResponse(new BatchResource($batch), 'Baja de stock del lote realizada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = [
            'search'    => trim((string) $request->query('search')),
            'branch_id' => $this->resolveBranchScope($request),
            'status'    => $request->query('status', 'all'),
        ];
        $sortBy = (string) $request->query('sort_by', 'expiration_date');
        $sortDir = (string) $request->query('sort_dir', 'asc');

        return $this->batchService->export($format, $filters, $sortBy, $sortDir);
    }
}
