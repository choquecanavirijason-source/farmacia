<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\InventoryMovements\StoreInventoryMovementRequest;
use App\Http\Requests\InventoryMovements\UpdateInventoryMovementRequest;
use App\Http\Resources\InventoryMovements\InventoryMovementResource;
use App\Models\InventoryMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class InventoryMovementController extends Controller
{
    public function index(Request $request)
    {
        return InventoryMovementResource::collection(InventoryMovement::query()->filter($request->only(['batch_id', 'type']))->sort((string) $request->query('sort_by', 'occurred_at'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StoreInventoryMovementRequest $request)
    {
        return (new InventoryMovementResource(InventoryMovement::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new InventoryMovementResource(InventoryMovement::findOrFail($id));
    }

    public function update(UpdateInventoryMovementRequest $request, int $id)
    {
        $item = InventoryMovement::findOrFail($id);
        $item->update($request->validated());

        return new InventoryMovementResource($item->refresh());
    }

    public function destroy(int $id)
    {
        InventoryMovement::findOrFail($id)->delete();

        return response()->json(['message' => 'Inventory movement deleted.']);
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
