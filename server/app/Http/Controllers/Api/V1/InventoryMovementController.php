<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\InventoryMovements\StoreInventoryMovementRequest;
use App\Http\Requests\InventoryMovements\UpdateInventoryMovementRequest;
use App\Http\Resources\InventoryMovements\InventoryMovementResource;
use App\Models\InventoryMovement;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class InventoryMovementController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $movements = InventoryMovement::query()->filter($request->only(['batch_id', 'type']))->sort((string) $request->query('sort_by', 'occurred_at'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(InventoryMovementResource::collection($movements), 'Movimientos de inventario obtenidos con éxito.');
    }

    public function store(StoreInventoryMovementRequest $request)
    {
        $movement = InventoryMovement::create($request->validated());

        return $this->createdResponse(new InventoryMovementResource($movement), 'Movimiento de inventario registrado con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new InventoryMovementResource(InventoryMovement::findOrFail($id)), 'Movimiento de inventario obtenido con éxito.');
    }

    public function update(UpdateInventoryMovementRequest $request, int $id)
    {
        $item = InventoryMovement::findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new InventoryMovementResource($item->refresh()), 'Movimiento de inventario actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        InventoryMovement::findOrFail($id)->delete();

        return $this->deletedResponse('Movimiento de inventario eliminado con éxito.');
    }

    public function export(Request $request)
    {
        $items = InventoryMovement::orderByDesc('occurred_at')->get();
        $c = ['Batch' => 'batch_id', 'Type' => 'type', 'Quantity' => 'quantity', 'Balance' => 'balance', 'Reason' => 'reason', 'Occurred at' => 'occurred_at'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Inventory movements', 'columns' => $c, 'records' => $items])->download('inventory-movements.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'inventory-movements.xlsx');
    }
}
