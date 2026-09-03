<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\Branch;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Facades\Excel;
use OwenIt\Auditing\Models\Audit;
use Symfony\Component\HttpFoundation\Response;

class AuditService
{
    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'created_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return $this->buildQuery($filters, $sortBy, $sortDir)->paginate($perPage);
    }

    public function getById(int $id): Audit
    {
        return Audit::with(['user', 'auditable'])->findOrFail($id);
    }

    public function export(string $format, array $filters): Response
    {
        $branchNamesById = Branch::withTrashed()->pluck('name', 'id');

        $records = $this->buildQuery($filters)->get()->map(function ($audit) use ($branchNamesById) {
            $branchId = data_get($audit->new_values, 'branch_id')
                ?? data_get($audit->old_values, 'branch_id')
                ?? $audit->auditable?->branch_id;

            return [
                'usuario'   => $audit->user?->name ?? 'Sistema',
                'evento'    => match ($audit->event) {
                    'created'  => 'Creación',
                    'updated'  => 'Modificación',
                    'deleted'  => 'Eliminación',
                    'restored' => 'Restauración',
                    default    => ucfirst($audit->event),
                },
                'modulo'    => class_basename($audit->auditable_type),
                'id_modulo' => $audit->auditable_id,
                'sucursal'  => $branchId ? ($branchNamesById[$branchId] ?? "Sucursal #{$branchId}") : '—',
                'ip'        => $audit->ip_address,
                'fecha'     => $audit->created_at?->format('d/m/Y H:i:s'),
            ];
        });

        $columns = [
            'Usuario'      => 'usuario',
            'Evento'       => 'evento',
            'Módulo'       => 'modulo',
            'ID Registro'  => 'id_modulo',
            'Sucursal'     => 'sucursal',
            'IP'           => 'ip',
            'Fecha y Hora' => 'fecha',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Auditoría y Actividades', 'columns' => $columns, 'records' => $records])->download('actividades_auditoria.pdf')
            : Excel::download(new RecordsExport($records, $columns), 'actividades_auditoria.xlsx');
    }

    private function buildQuery(array $filters, string $sortBy = 'created_at', string $sortDir = 'desc'): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $period = trim((string) ($filters['period'] ?? ''));
        $dateFrom = trim((string) ($filters['date_from'] ?? ''));
        $dateTo = trim((string) ($filters['date_to'] ?? ''));
        $event = trim((string) ($filters['event'] ?? ''));
        $model = trim((string) ($filters['model'] ?? ''));
        $branchId = !empty($filters['branch_id']) ? (int) $filters['branch_id'] : null;

        return Audit::query()
            ->with(['user', 'auditable'])
            ->when($branchId, function (Builder $query) use ($branchId) {
                // Muestra los eventos de esa sucursal, más los que no tienen sucursal asociada
                // (cambios de catálogo, roles, configuración, etc. — son globales por diseño).
                // Un evento "updated" solo guarda los campos que cambiaron, así que si branch_id
                // no fue uno de ellos (ej. una venta que solo toca `current_quantity` de un lote)
                // no aparece en el diff — por eso también se cruza contra la tabla real del modelo.
                $branchScopedTables = [
                    'App\\Models\\Batch'        => 'batches',
                    'App\\Models\\Sale'         => 'sales',
                    'App\\Models\\Purchase'     => 'purchases',
                    'App\\Models\\CashRegister' => 'cash_registers',
                ];

                $query->where(function (Builder $q) use ($branchId, $branchScopedTables) {
                    $q->where(function (Builder $q2) use ($branchId) {
                        $q2->where('new_values', 'like', '%"branch_id":' . $branchId . '%')
                            ->orWhere('old_values', 'like', '%"branch_id":' . $branchId . '%');
                    });

                    foreach ($branchScopedTables as $modelClass => $table) {
                        $q->orWhere(function (Builder $q2) use ($modelClass, $table, $branchId) {
                            $q2->where('auditable_type', $modelClass)
                                ->whereExists(function ($sub) use ($table, $branchId) {
                                    $sub->selectRaw('1')
                                        ->from($table)
                                        ->whereColumn("{$table}.id", 'audits.auditable_id')
                                        ->where("{$table}.branch_id", $branchId);
                                });
                        });
                    }

                    $q->orWhere(function (Builder $q2) use ($branchScopedTables) {
                        $q2->where(fn (Builder $q3) => $q3->whereNull('new_values')->orWhere('new_values', 'not like', '%"branch_id"%'))
                            ->where(fn (Builder $q3) => $q3->whereNull('old_values')->orWhere('old_values', 'not like', '%"branch_id"%'))
                            ->whereNotIn('auditable_type', array_keys($branchScopedTables));
                    });
                });
            })
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('ip_address', 'like', "%{$search}%")
                        ->orWhere('auditable_type', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhereHas('user', fn (Builder $uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($event !== '' && $event !== 'all', fn (Builder $query) => $query->where('event', $event))
            ->when($model !== '' && $model !== 'all', fn (Builder $query) => $query->where('auditable_type', 'like', "%{$model}%"))
            ->when($period === 'today', fn (Builder $query) => $query->whereDate('created_at', Carbon::today()))
            ->when($period === 'week', fn (Builder $query) => $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]))
            ->when($period === 'month', fn (Builder $query) => $query->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]))
            ->when($period === 'custom' || ($dateFrom !== '' || $dateTo !== ''), function (Builder $query) use ($dateFrom, $dateTo) {
                if ($dateFrom !== '') {
                    $query->whereDate('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
                }
                if ($dateTo !== '') {
                    $query->whereDate('created_at', '<=', Carbon::parse($dateTo)->endOfDay());
                }
            })
            ->orderBy($sortBy, $sortDir);
    }
}
