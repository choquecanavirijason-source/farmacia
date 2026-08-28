<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Medicaments\StoreMedicamentRequest;
use App\Http\Requests\Medicaments\UpdateMedicamentRequest;
use App\Http\Resources\Medicaments\MedicamentResource;
use App\Models\Medicament;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class MedicamentController extends Controller
{
    public function index(Request $request)
    {
        $query = Medicament::query();
        if ($search = trim((string) $request->query('search'))) {
            $query->search($search);
        }

        $query->filter($request->only(['status', 'category_id']));

        return MedicamentResource::collection($query->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StoreMedicamentRequest $request)
    {
        return (new MedicamentResource(Medicament::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new MedicamentResource(Medicament::findOrFail($id));
    }

    public function update(UpdateMedicamentRequest $request, int $id)
    {
        $item = Medicament::findOrFail($id);
        $item->update($request->validated());

        return new MedicamentResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Medicament::findOrFail($id)->delete();

        return response()->json(['message' => 'Medicament deleted.']);
    }

    /** Kardex combinado de todos los lotes de un medicamento, con el número de lote de cada fila. */
    public function kardex(int $id)
    {
        Medicament::findOrFail($id);

        return response()->json(
            \App\Models\InventoryMovement::query()
                ->join('batches', 'batches.id', '=', 'inventory_movements.batch_id')
                ->where('batches.medicament_id', $id)
                ->orderByDesc('inventory_movements.occurred_at')
                ->select('inventory_movements.*', 'batches.batch_number')
                ->get()
        );
    }

    public function export(Request $request)
    {
        $items = Medicament::orderBy('name')->get();
        $c = ['Code' => 'code', 'Name' => 'name', 'Concentration' => 'concentration', 'Price' => 'price', 'Min stock' => 'min_stock', 'Status' => 'status'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Medicaments', 'columns' => $c, 'records' => $items])->download('medicaments.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'medicaments.xlsx');
    }
}
