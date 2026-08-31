<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\Client;
use App\Models\Medicament;
use App\Models\Sale;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController
{
    use ApiResponseTrait;

    public function stats(Request $request)
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // Ventas de hoy (usando sold_at de la tabla sales)
        $ventasHoyQuery = Sale::where('status', 'active')
            ->whereDate('sold_at', $today);
        $totalVentasHoy = (float) $ventasHoyQuery->sum('total');
        $countVentasHoy = (int) $ventasHoyQuery->count();

        // Ventas del mes
        $totalVentasMes = (float) Sale::where('status', 'active')
            ->where('sold_at', '>=', $startOfMonth)
            ->sum('total');

        // Totales de clientes y medicamentos
        $totalClientes = Client::count();
        $totalMedicamentos = Medicament::count();

        // Medicamentos con Stock Bajo
        $stockBajoCount = Medicament::where('status', 'active')
            ->whereRaw('(SELECT COALESCE(SUM(current_quantity), 0) FROM batches WHERE batches.medicament_id = medicaments.id AND batches.deleted_at IS NULL) <= medicaments.min_stock')
            ->count();

        // Lotes próximos a vencer en los próximos 90 días con stock disponible
        $en90Dias = Carbon::now()->addDays(90);
        $lotesPorVencerCount = Batch::where('current_quantity', '>', 0)
            ->where('expiration_date', '<=', $en90Dias)
            ->count();

        // Estado de la caja abierta actualmente
        $cajaAbierta = CashRegister::where('status', 'open')->latest('opened_at')->first();

        // Últimas 5 ventas
        $ultimasVentas = Sale::with('client')
            ->where('status', 'active')
            ->latest('sold_at')
            ->limit(5)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'fecha_hora' => $s->sold_at?->toISOString(),
                    'total' => (float) $s->total,
                    'cliente' => $s->client?->name ?? 'Cliente General',
                    'estado' => $s->status,
                ];
            });

        // Top 5 medicamentos más vendidos
        $topProductos = [];
        try {
            $topProductos = DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('medicaments', 'medicaments.id', '=', 'sale_details.medicament_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereNull('sale_details.deleted_at')
                ->select('medicaments.id', 'medicaments.name', DB::raw('SUM(sale_details.quantity) as total_vendido'), DB::raw('SUM(sale_details.subtotal) as total_recaudado'))
                ->groupBy('medicaments.id', 'medicaments.name')
                ->orderByDesc('total_vendido')
                ->limit(5)
                ->get();
        } catch (\Throwable $e) {
            // Si no hay datos aún, continuar con lista vacía
        }

        $data = [
            'ventas_hoy' => [
                'total' => $totalVentasHoy,
                'cantidad' => $countVentasHoy,
            ],
            'ventas_mes' => [
                'total' => $totalVentasMes,
            ],
            'stock_bajo_count' => $stockBajoCount,
            'lotes_por_vencer_count' => $lotesPorVencerCount,
            'total_clientes' => $totalClientes,
            'total_medicamentos' => $totalMedicamentos,
            'caja_abierta' => $cajaAbierta ? [
                'id' => $cajaAbierta->id,
                'opened_at' => $cajaAbierta->opened_at?->toISOString(),
                'opening_amount' => (float) $cajaAbierta->opening_amount,
                'status' => $cajaAbierta->status,
            ] : null,
            'ultimas_ventas' => $ultimasVentas,
            'top_productos' => $topProductos,
        ];

        return $this->successResponse($data, 'Estadísticas del panel principal obtenidas con éxito.');
    }
}
