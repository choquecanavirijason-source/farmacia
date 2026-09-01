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
    public function getStats(): array
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

        $topProducts = [];
        try {
            $topProducts = DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('medicaments', 'medicaments.id', '=', 'sale_details.medicament_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereNull('sale_details.deleted_at')
                ->select(
                    'medicaments.id',
                    'medicaments.name',
                    DB::raw('SUM(sale_details.quantity) as total_vendido'),
                    DB::raw('SUM(sale_details.subtotal) as total_recaudado')
                )
                ->groupBy('medicaments.id', 'medicaments.name')
                ->orderByDesc('total_vendido')
                ->limit(5)
                ->get();
        } catch (\Throwable) {
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
            'ultimas_ventas' => $recentSales,
            'top_productos'  => $topProducts,
        ];
    }
}
