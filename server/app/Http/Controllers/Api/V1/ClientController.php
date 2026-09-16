<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Clients\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class ClientController
{
    use ApiResponseTrait;

    public function __construct(
        protected ClientService $clientService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = [
            'search' => $request->getSearch(),
            'status' => $request->query('status', 'active'),
        ];

        $result = $this->clientService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('updated_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(ClientResource::collection($result), 'Clientes obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $client = Client::withTrashed()->findOrFail($id);
        return $this->resourceResponse(new ClientResource($client), 'Cliente obtenido con éxito.');
    }

    public function store(StoreClientRequest $request)
    {
        $client = $this->clientService->create($request->validated());
        return $this->createdResponse(new ClientResource($client), 'Cliente registrado con éxito.');
    }

    public function update(UpdateClientRequest $request, int $id)
    {
        $client = Client::withTrashed()->findOrFail($id);
        $updatedClient = $this->clientService->update($client, $request->validated());
        return $this->updatedResponse(new ClientResource($updatedClient), 'Cliente actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->clientService->delete($id);
        return $this->deletedResponse('Cliente eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->clientService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Clientes eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $client = $this->clientService->restore($id);
        return $this->updatedResponse(new ClientResource($client), 'Cliente restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = [
            'search'   => $request->query('search'),
            'status'   => $request->query('status', 'all'),
            'sort_by'  => $request->query('sort_by', 'firstname'),
            'sort_dir' => $request->query('sort_dir', 'asc'),
        ];

        return $this->clientService->export($format, $filters);
    }
}
