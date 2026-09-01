<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\Client;
use App\Models\Medicament;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getStats(array $filters = []): array
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $salesTodayQuery = Sale::where('status', 'active')->whereDate('sold_at', $today);
        $totalSalesToday = (float) $salesTodayQuery->sum('total');
        $salesCountToday = (int) $salesTodayQuery->count();

        $totalSalesMonth = (float) Sale::where('status', 'active')
            ->where('sold_at', '>=', $startOfMonth)
            ->sum('total');

        $totalClients = Client::count();
        $totalMedicaments = Medicament::count();

        $lowStockCount = Medicament::where('status', 'active')
            ->whereRaw('(SELECT COALESCE(SUM(current_quantity), 0) FROM batches WHERE batches.medicament_id = medicaments.id AND batches.deleted_at IS NULL) <= medicaments.min_stock')
            ->count();

        $in90Days = Carbon::now()->addDays(90);
        $expiringBatchesCount = Batch::where('current_quantity', '>', 0)
            ->where('expiration_date', '<=', $in90Days)
            ->count();

        $openCashRegister = CashRegister::where('status', 'open')->latest('opened_at')->first();

        $recentSales = Sale::with('client')
            ->where('status', 'active')
            ->latest('sold_at')
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id'         => $s->id,
                'fecha_hora' => $s->sold_at?->toISOString(),
                'total'      => (float) $s->total,
                'cliente'    => $s->client?->name ?? 'Cliente General',
                'estado'     => $s->status,
            ]);

        // Default 7 days
        $ventasPorDia7 = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $total = (float) Sale::where('status', 'active')
                ->whereDate('sold_at', $date)
                ->sum('total');
            $ventasPorDia7[] = [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->locale('es')->isoFormat('D MMM'),
                'value' => round($total, 2),
            ];
        }

        // Default 30 days
        $ventasPorDia30 = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $total = (float) Sale::where('status', 'active')
                ->whereDate('sold_at', $date)
                ->sum('total');
            $ventasPorDia30[] = [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->locale('es')->isoFormat('D MMM'),
                'value' => round($total, 2),
            ];
        }

        // Custom date range support
        $startDate = !empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : Carbon::today()->subDays(6)->startOfDay();

        $endDate = !empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : Carbon::today()->endOfDay();

        if ($startDate->gt($endDate)) {
            $temp = $startDate;
            $startDate = $endDate->copy()->startOfDay();
            $endDate = $temp->copy()->endOfDay();
        }

        $totalRango = (float) Sale::where('status', 'active')
            ->whereBetween('sold_at', [$startDate, $endDate])
            ->sum('total');

        $ventasPorRango = [];
        $diffDays = $startDate->diffInDays($endDate);

        if ($diffDays <= 90) {
            $curr = $startDate->copy()->startOfDay();
            while ($curr->lte($endDate)) {
                $total = (float) Sale::where('status', 'active')
                    ->whereDate('sold_at', $curr)
                    ->sum('total');
                $ventasPorRango[] = [
                    'date'  => $curr->format('Y-m-d'),
                    'label' => $curr->locale('es')->isoFormat('D MMM'),
                    'value' => round($total, 2),
                ];
                $curr->addDay();
            }
        } else {
            $curr = $startDate->copy()->startOfMonth();
            while ($curr->lte($endDate)) {
                $total = (float) Sale::where('status', 'active')
                    ->whereBetween('sold_at', [$curr->copy()->startOfMonth(), $curr->copy()->endOfMonth()])
                    ->sum('total');
                $ventasPorRango[] = [
                    'date'  => $curr->format('Y-m'),
                    'label' => $curr->locale('es')->isoFormat('MMM YYYY'),
                    'value' => round($total, 2),
                ];
                $curr->addMonth();
            }
        }

        // Top products within date range
        $topProducts = [];
        try {
            $topProducts = DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('medicaments', 'medicaments.id', '=', 'sale_details.medicament_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereNull('medicaments.deleted_at')
                ->whereBetween('sales.sold_at', [$startDate, $endDate])
                ->select(
                    'medicaments.id',
                    'medicaments.name',
                    'medicaments.code',
                    DB::raw('SUM(sale_details.quantity) as total_vendido'),
                    DB::raw('SUM(sale_details.subtotal) as total_recaudado')
                )
                ->groupBy('medicaments.id', 'medicaments.name', 'medicaments.code')
                ->orderByDesc('total_vendido')
                ->limit(10)
                ->get();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error in top_productos query: ' . $e->getMessage());
            $topProducts = [];
        }

        return [
            'ventas_hoy' => [
                'total'    => $totalSalesToday,
                'cantidad' => $salesCountToday,
            ],
            'ventas_mes' => [
                'total' => $totalSalesMonth,
            ],
            'stock_bajo_count'       => $lowStockCount,
            'lotes_por_vencer_count' => $expiringBatchesCount,
            'total_clientes'         => $totalClients,
            'total_medicamentos'     => $totalMedicaments,
            'caja_abierta'           => $openCashRegister ? [
                'id'             => $openCashRegister->id,
                'opened_at'      => $openCashRegister->opened_at?->toISOString(),
                'opening_amount' => (float) $openCashRegister->opening_amount,
                'status'         => $openCashRegister->status,
            ] : null,
            'ultimas_ventas'         => $recentSales,
            'top_productos'          => $topProducts,
            'ventas_ultimos_7_dias'  => $ventasPorDia7,
            'ventas_ultimos_30_dias' => $ventasPorDia30,
            'ventas_por_rango'       => $ventasPorRango,
            'ventas_rango_total'     => $totalRango,
            'rango_inicio'           => $startDate->format('Y-m-d'),
            'rango_fin'              => $endDate->format('Y-m-d'),
        ];
    }
}
