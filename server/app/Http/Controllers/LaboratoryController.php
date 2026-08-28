<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Laboratories\StoreLaboratoryRequest;
use App\Http\Requests\Laboratories\UpdateLaboratoryRequest;
use App\Http\Resources\Laboratories\LaboratoryResource;
use App\Models\Laboratory;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class LaboratoryController extends Controller
{
    public function index(Request $request)
    {
        return LaboratoryResource::collection(Laboratory::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StoreLaboratoryRequest $request)
    {
        return (new LaboratoryResource(Laboratory::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new LaboratoryResource(Laboratory::findOrFail($id));
    }

    public function update(UpdateLaboratoryRequest $request, int $id)
    {
        $item = Laboratory::findOrFail($id);
        $item->update($request->validated());

        return new LaboratoryResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Laboratory::findOrFail($id)->delete();

        return response()->json(['message' => 'Laboratory deleted.']);
    }

    public function export(Request $request)
    {
        $items = Laboratory::orderBy('name')->get();
        $c = ['Name' => 'name', 'Country' => 'country', 'Phone' => 'phone'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Laboratories', 'columns' => $c, 'records' => $items])->download('laboratories.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'laboratories.xlsx');
    }
}
