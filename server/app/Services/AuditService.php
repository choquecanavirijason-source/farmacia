<?php

namespace App\Services;

use App\Exports\RecordsExport;
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
        return Audit::with('user')->findOrFail($id);
    }

    public function export(string $format, array $filters): Response
    {
        $records = $this->buildQuery($filters)->get()->map(fn ($audit) => [
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
            'ip'        => $audit->ip_address,
            'fecha'     => $audit->created_at?->format('d/m/Y H:i:s'),
        ]);

        $columns = [
            'Usuario'      => 'usuario',
            'Evento'       => 'evento',
            'Módulo'       => 'modulo',
            'ID Registro'  => 'id_modulo',
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

        return Audit::query()
            ->with('user')
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
