<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Resources\Clients\ClientResource;
use App\Models\Client;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $clients = Client::query()->when($search !== '', fn ($query) => $query->search($search))->sort((string) $request->query('sort_by', 'firstname'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10)));

        return ClientResource::collection($clients);
    }

    public function store(StoreClientRequest $request)
    {
        return (new ClientResource(Client::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new ClientResource(Client::findOrFail($id));
    }

    public function update(UpdateClientRequest $request, int $id)
    {
        $client = Client::findOrFail($id);
        $client->update($request->validated());

        return new ClientResource($client->refresh());
    }

    public function destroy(int $id)
    {
        Client::findOrFail($id)->delete();

        return response()->json(['message' => 'Client deleted.']);
    }

    public function export(Request $request)
    {
        $clients = Client::query()->orderBy('firstname')->get();

        return strtolower((string) $request->query('format', 'excel')) === 'pdf' ? $this->exportPdf($clients) : $this->exportExcel($clients);
    }

    private function exportExcel($clients)
    {
        return Excel::download(new RecordsExport($clients, ['First name' => 'firstname', 'Last name' => 'lastname', 'CI' => 'ci', 'NIT' => 'nit', 'Phone' => 'phone', 'Address' => 'address']), 'clients.xlsx');
    }

    private function exportPdf($clients)
    {
        return Pdf::loadView('exports.records', ['title' => 'Clients', 'columns' => ['First name' => 'firstname', 'Last name' => 'lastname', 'CI' => 'ci', 'NIT' => 'nit', 'Phone' => 'phone', 'Address' => 'address'], 'records' => $clients])->download('clients.pdf');
    }
}
