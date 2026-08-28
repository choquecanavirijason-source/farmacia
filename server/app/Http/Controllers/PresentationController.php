<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Presentations\StorePresentationRequest;
use App\Http\Requests\Presentations\UpdatePresentationRequest;
use App\Http\Resources\Presentations\PresentationResource;
use App\Models\Presentation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PresentationController extends Controller
{
    public function index(Request $request)
    {
        return PresentationResource::collection(Presentation::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StorePresentationRequest $request)
    {
        return (new PresentationResource(Presentation::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new PresentationResource(Presentation::findOrFail($id));
    }

    public function update(UpdatePresentationRequest $request, int $id)
    {
        $item = Presentation::findOrFail($id);
        $item->update($request->validated());

        return new PresentationResource($item->refresh());
    }

    public function destroy(int $id)
    {
        Presentation::findOrFail($id)->delete();

        return response()->json(['message' => 'Presentation deleted.']);
    }

    public function export(Request $request)
    {
        $items = Presentation::orderBy('name')->get();
        $c = ['Name' => 'name', 'Description' => 'description'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Presentations', 'columns' => $c, 'records' => $items])->download('presentations.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'presentations.xlsx');
    }
}
