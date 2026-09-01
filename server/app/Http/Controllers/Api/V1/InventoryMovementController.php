<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InventoryMovements\StoreInventoryMovementRequest;
use App\Http\Requests\InventoryMovements\UpdateInventoryMovementRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\InventoryMovements\InventoryMovementResource;
use App\Models\InventoryMovement;
use App\Services\InventoryMovementService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class InventoryMovementController
{
    use ApiResponseTrait;

    public function __construct(
        protected InventoryMovementService $inventoryMovementService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['batch_id', 'type']);

        $result = $this->inventoryMovementService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('occurred_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(InventoryMovementResource::collection($result), 'Movimientos de inventario obtenidos con éxito.');
    }

    public function store(StoreInventoryMovementRequest $request)
    {
        $movement = $this->inventoryMovementService->create($request->validated());
        return $this->createdResponse(new InventoryMovementResource($movement), 'Movimiento de inventario registrado con éxito.');
    }

    public function show(int $id)
    {
        $movement = InventoryMovement::findOrFail($id);
        return $this->resourceResponse(new InventoryMovementResource($movement), 'Movimiento de inventario obtenido con éxito.');
    }

    public function update(UpdateInventoryMovementRequest $request, int $id)
    {
        $movement = InventoryMovement::findOrFail($id);
        $updatedMovement = $this->inventoryMovementService->update($movement, $request->validated());
        return $this->updatedResponse(new InventoryMovementResource($updatedMovement), 'Movimiento de inventario actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->inventoryMovementService->delete($id);
        return $this->deletedResponse('Movimiento de inventario eliminado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->inventoryMovementService->export($format);
    }
}
