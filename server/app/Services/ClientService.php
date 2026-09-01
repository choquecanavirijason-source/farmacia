<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Client;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class ClientService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'updated_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        $status = $filters['status'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));

        $query = match ($status) {
            'active'             => Client::withoutTrashed(),
            'trashed', 'deleted' => Client::onlyTrashed(),
            default              => Client::withTrashed(),
        };

        return $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Client
    {
        return Client::create($data);
    }

    public function update(Client $client, array $data): Client
    {
        $client->update($data);
        return $client->refresh();
    }

    public function delete(int $id): void
    {
        Client::findOrFail($id)->delete();
    }

    public function bulkDelete(array $ids): int
    {
        $clients = Client::whereIn('id', $ids)->get();
        foreach ($clients as $client) {
            $client->delete();
        }
        return $clients->count();
    }

    public function restore(int $id): Client
    {
        $client = Client::onlyTrashed()->findOrFail($id);
        $client->restore();
        return $client;
    }

    public function export(string $format, array $filters = []): Response
    {
        $status = $filters['status'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));
        $sortBy = $filters['sort_by'] ?? 'firstname';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $query = match ($status) {
            'active'             => Client::withoutTrashed(),
            'trashed', 'deleted' => Client::onlyTrashed(),
            default              => Client::withTrashed(),
        };

        $records = $query
            ->when($search !== '', fn ($q) => $q->search($search))
            ->sort($sortBy, $sortDir)
            ->get();

        $columns = [
            'Nombre'    => 'firstname',
            'Apellido'  => 'lastname',
            'CI'        => 'ci',
            'NIT'       => 'nit',
            'Teléfono'  => 'phone',
            'Dirección' => 'address',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Clientes', 'columns' => $columns, 'records' => $records])->download('clientes.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'clientes.xlsx');
    }
}
