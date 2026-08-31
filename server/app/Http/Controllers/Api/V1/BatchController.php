<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Batches\StoreBatchRequest;
use App\Http\Requests\Batches\UpdateBatchRequest;
use App\Http\Resources\Batches\BatchResource;
use App\Models\Batch;
use App\Models\InventoryAdjustment;
use App\Models\InventoryMovement;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class BatchController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Batch::withTrashed()
            ->with('medicament')
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'expiration_date'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(BatchResource::collection($result), 'Lotes obtenidos con éxito.');
    }

    public function store(StoreBatchRequest $request)
    {
        $batch = DB::transaction(function () use ($request) {
            $batch = Batch::create($request->validated());

            InventoryMovement::create([
                'batch_id'    => $batch->id,
                'type'        => 'in',
                'quantity'    => $batch->current_quantity,
                'balance'     => $batch->current_quantity,
                'reason'      => 'Registro inicial de lote',
                'occurred_at' => now(),
            ]);

            return $batch;
        });

        return $this->createdResponse(new BatchResource($batch), 'Lote registrado con éxito con su movimiento inicial.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new BatchResource(Batch::withTrashed()->with('medicament')->findOrFail($id)), 'Lote obtenido con éxito.');
    }

    public function update(UpdateBatchRequest $request, int $id)
    {
        $item = Batch::withTrashed()->findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new BatchResource($item->refresh()), 'Lote actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $lote = Batch::findOrFail($id);
        $lote->delete();

        return $this->deletedResponse('Lote eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $batches = Batch::whereIn('id', (array) $request->ids)->get();
        foreach ($batches as $batch) {
            $batch->delete();
        }

        return $this->deletedResponse('Lotes eliminados con éxito.');
    }

    public function kardex(int $id)
    {
        Batch::withTrashed()->findOrFail($id);

        $movements = InventoryMovement::where('batch_id', $id)->orderByDesc('occurred_at')->get();

        return $this->successResponse($movements, 'Movimientos de kardex del lote obtenidos con éxito.');
    }

    public function sell(Request $request, int $id)
    {
        return $this->successResponse($this->moverStock($id, $request, 'out', -1), 'Salida de stock del lote realizada con éxito.');
    }

    public function restore(Request $request, int $id)
    {
        if ($request->filled('cantidad')) {
            return $this->successResponse($this->moverStock($id, $request, 'in', 1), 'Restauración de stock del lote realizada con éxito.');
        }

        $batch = Batch::onlyTrashed()->findOrFail($id);
        $batch->restore();

        return $this->updatedResponse(new BatchResource($batch), 'Lote restaurado con éxito.');
    }

    private function moverStock(int $id, Request $request, string $tipo, int $signo): Batch
    {
        $lote = Batch::findOrFail($id);

        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo'   => ['required', 'string', 'max:150'],
        ]);

        if ($tipo === 'out' && $data['cantidad'] > $lote->current_quantity) {
            throw ValidationException::withMessages([
                'cantidad' => ["Stock insuficiente en el lote {$lote->batch_number}."],
            ]);
        }

        return DB::transaction(function () use ($lote, $data, $tipo, $signo) {
            $saldo = $lote->current_quantity + ($signo * $data['cantidad']);
            $lote->update(['current_quantity' => $saldo]);

            InventoryMovement::create([
                'batch_id'    => $lote->id,
                'type'        => $tipo,
                'quantity'    => $signo * $data['cantidad'],
                'balance'     => $saldo,
                'reason'      => $data['motivo'],
                'occurred_at' => now(),
            ]);

            return $lote;
        });
    }

    public function dispose(Request $request, int $id)
    {
        $lote = Batch::findOrFail($id);

        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo'   => ['required', Rule::in(['Vencimiento', 'Daño', 'Extravío', 'Otro'])],
        ]);

        if ($data['cantidad'] > $lote->current_quantity) {
            throw ValidationException::withMessages([
                'cantidad' => ["La cantidad debe estar entre 1 y {$lote->current_quantity}."],
            ]);
        }

        $motivoEn = ['Vencimiento' => 'expiration', 'Daño' => 'damage', 'Extravío' => 'loss', 'Otro' => 'other'];
        $actor = $request->user();

        $lote = DB::transaction(function () use ($lote, $data, $motivoEn, $actor) {
            $saldo = $lote->current_quantity - $data['cantidad'];
            $lote->update(['current_quantity' => $saldo]);

            InventoryAdjustment::create([
                'batch_id'    => $lote->id,
                'quantity'    => $data['cantidad'],
                'reason'      => $motivoEn[$data['motivo']],
                'user_id'     => $actor->id,
                'occurred_at' => now(),
            ]);

            InventoryMovement::create([
                'batch_id'    => $lote->id,
                'type'        => 'adjustment',
                'quantity'    => -$data['cantidad'],
                'balance'     => $saldo,
                'reason'      => $data['motivo'],
                'occurred_at' => now(),
            ]);

            return $lote;
        });

        return $this->successResponse($lote, 'Baja de stock del lote realizada con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = Batch::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'expiration_date'),
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
            'Número de Lote'        => 'batch_number',
            'Fecha de Vencimiento'  => 'expiration_date',
            'Cantidad Actual'       => 'current_quantity',
            'Precio de Compra (Bs)' => 'purchase_price',
        ]), 'lotes.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Lotes',
            'columns' => [
                'Número de Lote'        => 'batch_number',
                'Fecha de Vencimiento'  => 'expiration_date',
                'Cantidad Actual'       => 'current_quantity',
                'Precio de Compra (Bs)' => 'purchase_price',
            ],
            'records' => $items,
        ])->download('lotes.pdf');
    }
}
