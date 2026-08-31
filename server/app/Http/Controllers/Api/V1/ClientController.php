<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Resources\Clients\ClientResource;
use App\Models\Client;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ClientController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = Client::withTrashed()
            ->when($search !== '', fn($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'updated_at'),
                (string) $request->query('sort_dir', 'desc')
            )
            ->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(ClientResource::collection($result), 'Clientes obtenidos con éxito.');
    }

    public function store(StoreClientRequest $request)
    {
        $result = Client::create($request->validated());

        return $this->createdResponse(new ClientResource($result), 'Cliente registrado con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new ClientResource(Client::withTrashed()->findOrFail($id)), 'Cliente obtenido con éxito.');
    }

    public function update(UpdateClientRequest $request, int $id)
    {
        $result = Client::withTrashed()->findOrFail($id);
        $result->update($request->validated());

        return $this->updatedResponse(new ClientResource($result->refresh()), 'Cliente actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        Client::findOrFail($id)->delete();

        return $this->deletedResponse('Cliente eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $clients = Client::whereIn('id', (array) $request->ids)->get();
        foreach ($clients as $client) {
            $client->delete();
        }

        return $this->deletedResponse('Clientes eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $client = Client::onlyTrashed()->findOrFail($id);
        $client->restore();

        return $this->updatedResponse(new ClientResource($client), 'Cliente restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $results = Client::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'firstname'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->get();

        return strtolower((string) $request->query('format', 'excel')) === 'pdf'
            ? $this->exportPdf($results)
            : $this->exportExcel($results);
    }

    private function exportExcel($results)
    {
        return Excel::download(new RecordsExport($results, [
            'Nombre' => 'firstname',
            'Apellido' => 'lastname',
            'CI' => 'ci',
            'NIT' => 'nit',
            'Teléfono' => 'phone',
            'Dirección' => 'address',
        ]), 'clientes.xlsx');
    }

    private function exportPdf($results)
    {
        return Pdf::loadView('exports.records', [
            'title' => 'Reporte de Clientes',
            'columns' => [
                'Nombre' => 'firstname',
                'Apellido' => 'lastname',
                'CI' => 'ci',
                'NIT' => 'nit',
                'Teléfono' => 'phone',
                'Dirección' => 'address',
            ],
            'records' => $results,
        ])->download('clientes.pdf');
    }
}
