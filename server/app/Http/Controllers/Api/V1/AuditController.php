<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Resources\Audits\AuditResource;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use OwenIt\Auditing\Models\Audit;

class AuditController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $query = $this->buildQuery($request);
        $perPage = max(1, $request->integer('per_page', $request->integer('pageSize', 10)));
        $result = $query->paginate($perPage);

        return $this->collectionResponse(AuditResource::collection($result), 'Auditorías obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $audit = Audit::with('user')->findOrFail($id);

        return $this->resourceResponse(new AuditResource($audit), 'Auditoría obtenida con éxito.');
    }

    public function export(Request $request)
    {
        $audits = $this->buildQuery($request)->get();

        $records = $audits->map(function ($audit) {
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
                'ip'        => $audit->ip_address,
                'fecha'     => $audit->created_at?->format('d/m/Y H:i:s'),
            ];
        });

        return strtolower((string) $request->query('format', 'excel')) === 'pdf'
            ? $this->exportPdf($records)
            : $this->exportExcel($records);
    }

    private function buildQuery(Request $request): Builder
    {
        $search = trim((string) $request->query('search'));
        $period = trim((string) $request->query('period'));
        $dateFrom = trim((string) $request->query('date_from'));
        $dateTo = trim((string) $request->query('date_to'));
        $event = trim((string) $request->query('event'));
        $model = trim((string) $request->query('model'));

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
            ->orderBy(
                (string) $request->query('sort_by', 'created_at'),
                (string) $request->query('sort_dir', 'desc')
            );
    }

    private function exportExcel($records)
    {
        return Excel::download(new RecordsExport($records, [
            'Usuario'         => 'usuario',
            'Evento'          => 'evento',
            'Módulo'          => 'modulo',
            'ID Registro'     => 'id_modulo',
            'IP'              => 'ip',
            'Fecha y Hora'    => 'fecha',
        ]), 'actividades_auditoria.xlsx');
    }

    private function exportPdf($records)
    {
        return Pdf::loadView('exports.records', [
            'title' => 'Reporte de Auditoría y Actividades',
            'columns' => [
                'Usuario'         => 'usuario',
                'Evento'          => 'evento',
                'Módulo'          => 'modulo',
                'ID Registro'     => 'id_modulo',
                'IP'              => 'ip',
                'Fecha y Hora'    => 'fecha',
            ],
            'records' => $records,
        ])->download('actividades_auditoria.pdf');
    }
}
