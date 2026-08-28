<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Batches\StoreBatchRequest;
use App\Http\Requests\Batches\UpdateBatchRequest;
use App\Http\Resources\Batches\BatchResource;
use App\Models\Batch;
use App\Models\InventoryAdjustment;
use App\Models\InventoryMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class BatchController extends Controller
{
    public function index(Request $request)
    {
        return BatchResource::collection(Batch::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'expiration_date'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    /** Alta de lote: queda registrado el kardex de entrada con el stock inicial. */
    public function store(StoreBatchRequest $request)
    {
        $batch = DB::transaction(function () use ($request) {
            $batch = Batch::create($request->validated());

            InventoryMovement::create([
                'batch_id' => $batch->id,
                'type' => 'in',
                'quantity' => $batch->current_quantity,
                'balance' => $batch->current_quantity,
                'reason' => 'Registro inicial de lote',
                'occurred_at' => now(),
            ]);

            return $batch;
        });

        return (new BatchResource($batch))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new BatchResource(Batch::findOrFail($id));
    }

    public function update(UpdateBatchRequest $request, int $id)
    {
        $item = Batch::findOrFail($id);
        $item->update($request->validated());

        return new BatchResource($item->refresh());
    }

    public function destroy(int $id)
    {
        $lote = Batch::findOrFail($id);

        if ($lote->current_quantity > 0) {
            return response()->json([
                'message' => 'No se puede eliminar: el lote todavía tiene stock. Da de baja el stock primero.',
            ], 409);
        }

        try {
            $lote->delete();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar: el lote tiene movimientos de kardex en su historial.',
            ], 409);
        }

        return response()->json(['message' => 'Lote eliminado.']);
    }

    /** Kardex (movimientos de inventario) de un lote, del más reciente al más antiguo. */
    public function kardex(int $id)
    {
        Batch::findOrFail($id);

        return response()->json(
            InventoryMovement::where('batch_id', $id)->orderByDesc('occurred_at')->get()
        );
    }

    public function sell(Request $request, int $id)
    {
        return response()->json($this->moverStock($id, $request, 'out', -1));
    }

    public function restore(Request $request, int $id)
    {
        return response()->json($this->moverStock($id, $request, 'in', 1));
    }

    private function moverStock(int $id, Request $request, string $tipo, int $signo): Batch
    {
        $lote = Batch::findOrFail($id);

        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['required', 'string', 'max:150'],
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
                'batch_id' => $lote->id,
                'type' => $tipo,
                'quantity' => $signo * $data['cantidad'],
                'balance' => $saldo,
                'reason' => $data['motivo'],
                'occurred_at' => now(),
            ]);

            return $lote;
        });
    }

    /** Da de baja stock del lote (vencimiento, daño, extravío u otro), con ajuste y kardex. */
    public function dispose(Request $request, int $id)
    {
        $lote = Batch::findOrFail($id);

        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['required', Rule::in(['Vencimiento', 'Daño', 'Extravío', 'Otro'])],
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
                'batch_id' => $lote->id,
                'quantity' => $data['cantidad'],
                'reason' => $motivoEn[$data['motivo']],
                'user_id' => $actor->id,
                'occurred_at' => now(),
            ]);

            InventoryMovement::create([
                'batch_id' => $lote->id,
                'type' => 'adjustment',
                'quantity' => -$data['cantidad'],
                'balance' => $saldo,
                'reason' => $data['motivo'],
                'occurred_at' => now(),
            ]);

            return $lote;
        });

        return response()->json($lote);
    }

    public function export(Request $request)
    {
        $items = Batch::orderBy('expiration_date')->get();
        $c = ['Batch number' => 'batch_number', 'Expiration date' => 'expiration_date', 'Current quantity' => 'current_quantity', 'Purchase price' => 'purchase_price', 'Medicament' => 'medicament_id'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Batches', 'columns' => $c, 'records' => $items])->download('batches.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'batches.xlsx');
    }
}
