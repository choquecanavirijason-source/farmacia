<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\Client;
use App\Models\Medicament;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    public function getStats(array $filters = []): array
    {
        $branchId = !empty($filters['branch_id']) ? (int) $filters['branch_id'] : null;

        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $salesTodayQuery = Sale::where('status', 'active')
            ->whereDate('sold_at', $today)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $totalSalesToday = (float) $salesTodayQuery->sum('total');
        $salesCountToday = (int) $salesTodayQuery->count();

        $totalSalesMonth = (float) Sale::where('status', 'active')
            ->where('sold_at', '>=', $startOfMonth)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->sum('total');

        $totalClients = Client::count();
        $totalMedicaments = Medicament::count();

        // En modo "una sucursal", solo cuenta medicamentos que ya tienen al menos un lote
        // registrado ahí (activo o agotado): uno que nunca se cargó en esa sucursal no es
        // "stock bajo", simplemente no se ha traspasado/comprado todavía para ella.
        $lowStockCount = Medicament::where('status', 'active')
            ->whereRaw(
                '(SELECT COALESCE(SUM(current_quantity), 0) FROM batches WHERE batches.medicament_id = medicaments.id AND batches.deleted_at IS NULL'
                . ($branchId ? ' AND batches.branch_id = ' . $branchId : '')
                . ') <= medicaments.min_stock'
            )
            ->when($branchId, fn ($q) => $q->whereRaw(
                'EXISTS (SELECT 1 FROM batches WHERE batches.medicament_id = medicaments.id AND batches.deleted_at IS NULL AND batches.branch_id = ' . $branchId . ')'
            ))
            ->count();

        $in90Days = Carbon::now()->addDays(90);
        $expiringBatchesCount = Batch::where('current_quantity', '>', 0)
            ->where('expiration_date', '<=', $in90Days)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->count();

        $openCashRegister = CashRegister::where('status', 'open')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->latest('opened_at')
            ->first();

        $recentSales = Sale::with('client')
            ->where('status', 'active')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
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
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
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
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->sum('total');
            $ventasPorDia30[] = [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->locale('es')->isoFormat('D MMM'),
                'value' => round($total, 2),
            ];
        }

        // Custom date range support
        [$startDate, $endDate] = $this->resolveDateRange($filters);

        $totalRango = (float) Sale::where('status', 'active')
            ->whereBetween('sold_at', [$startDate, $endDate])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->sum('total');

        $ventasPorRango = $this->getVentasPorRango($startDate, $endDate, $branchId);
        $topProducts = $this->getTopProductos($startDate, $endDate, $branchId);

        // Comparativa mes actual vs. mes anterior
        $startOfLastMonth = Carbon::now()->subMonthNoOverflow()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonthNoOverflow()->endOfMonth();
        $totalSalesLastMonth = (float) Sale::where('status', 'active')
            ->whereBetween('sold_at', [$startOfLastMonth, $endOfLastMonth])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->sum('total');

        $variacionMensual = $totalSalesLastMonth > 0
            ? round((($totalSalesMonth - $totalSalesLastMonth) / $totalSalesLastMonth) * 100, 1)
            : null;

        $ticketPromedioHoy = $salesCountToday > 0 ? round($totalSalesToday / $salesCountToday, 2) : 0.0;

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
            'ventas_mes_anterior'    => $totalSalesLastMonth,
            'variacion_mensual_pct'  => $variacionMensual,
            'ticket_promedio_hoy'    => $ticketPromedioHoy,
            'total_medicamentos_stock_saludable' => max(0, $totalMedicaments - $lowStockCount),

            // Gráficas adicionales del panel
            'ventas_por_metodo_pago' => $this->getVentasPorMetodoPago($startDate, $endDate, $branchId),
            'ventas_por_categoria'   => $this->getVentasPorCategoria($startDate, $endDate, $branchId),
            'margen_por_rango'       => $this->getMargenPorRango($startDate, $endDate, $branchId),
            'compras_por_proveedor'  => $this->getComprasPorProveedor(Carbon::now()->subDays(90), Carbon::now()->endOfDay(), $branchId),
            'ranking_vendedores'     => $this->getRankingVendedores($startDate, $endDate, $branchId),
            'lotes_semaforo'         => $this->getLotesSemaforo($branchId),
            'compras_vs_ventas'      => $this->getComprasVsVentas($branchId),
            'productos_baja_rotacion' => $this->getProductosBajaRotacion($branchId),
            'ventas_por_dia_semana'  => $this->getVentasPorDiaSemana($branchId),
            'ventas_por_hora_dia'    => $this->getVentasPorHoraDia($branchId),
        ];
    }

    /**
     * Resumen liviano de ventas para Reportes: solo tendencia por rango + top productos.
     * A diferencia de getStats(), no calcula el resto de las métricas del panel principal
     * (ranking de vendedores, margen, heatmap, etc.) que Reportes no usa.
     */
    public function getSalesSummary(array $filters = []): array
    {
        $branchId = !empty($filters['branch_id']) ? (int) $filters['branch_id'] : null;

        [$startDate, $endDate] = $this->resolveDateRange($filters);

        $totalRango = (float) Sale::where('status', 'active')
            ->whereBetween('sold_at', [$startDate, $endDate])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->sum('total');

        return [
            'ventas_por_rango'   => $this->getVentasPorRango($startDate, $endDate, $branchId),
            'ventas_rango_total' => $totalRango,
            'rango_inicio'       => $startDate->format('Y-m-d'),
            'rango_fin'          => $endDate->format('Y-m-d'),
            'top_productos'      => $this->getTopProductos($startDate, $endDate, $branchId),
        ];
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function resolveDateRange(array $filters): array
    {
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

        return [$startDate, $endDate];
    }

    private function getVentasPorRango(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        $ventasPorRango = [];
        $diffDays = $startDate->diffInDays($endDate);

        if ($diffDays <= 90) {
            $curr = $startDate->copy()->startOfDay();
            while ($curr->lte($endDate)) {
                $total = (float) Sale::where('status', 'active')
                    ->whereDate('sold_at', $curr)
                    ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
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
                    ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                    ->sum('total');
                $ventasPorRango[] = [
                    'date'  => $curr->format('Y-m'),
                    'label' => $curr->locale('es')->isoFormat('MMM YYYY'),
                    'value' => round($total, 2),
                ];
                $curr->addMonth();
            }
        }

        return $ventasPorRango;
    }

    private function getTopProductos(Carbon $startDate, Carbon $endDate, ?int $branchId = null)
    {
        try {
            return DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('medicaments', 'medicaments.id', '=', 'sale_details.medicament_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereNull('medicaments.deleted_at')
                ->whereBetween('sales.sold_at', [$startDate, $endDate])
                ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
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
            Log::error('Error in top_productos query: ' . $e->getMessage());
            return [];
        }
    }

    private function getVentasPorMetodoPago(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        try {
            return DB::table('sale_payments')
                ->join('sales', 'sales.id', '=', 'sale_payments.sale_id')
                ->join('payment_methods', 'payment_methods.id', '=', 'sale_payments.payment_method_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereBetween('sales.sold_at', [$startDate, $endDate])
                ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    'payment_methods.id',
                    'payment_methods.name',
                    DB::raw('SUM(sale_payments.amount) as total')
                )
                ->groupBy('payment_methods.id', 'payment_methods.name')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'total' => (float) $r->total])
                ->all();
        } catch (\Throwable $e) {
            Log::error('Error in ventas_por_metodo_pago query: ' . $e->getMessage());
            return [];
        }
    }

    private function getVentasPorCategoria(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        try {
            return DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('medicaments', 'medicaments.id', '=', 'sale_details.medicament_id')
                ->join('categories', 'categories.id', '=', 'medicaments.category_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereBetween('sales.sold_at', [$startDate, $endDate])
                ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    'categories.id',
                    'categories.name',
                    DB::raw('SUM(sale_details.subtotal) as total')
                )
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('total')
                ->limit(5)
                ->get()
                ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'total' => (float) $r->total])
                ->all();
        } catch (\Throwable $e) {
            Log::error('Error in ventas_por_categoria query: ' . $e->getMessage());
            return [];
        }
    }

    private function getMargenPorRango(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        try {
            $rows = DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('batches', 'batches.id', '=', 'sale_details.batch_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereBetween('sales.sold_at', [$startDate, $endDate])
                ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    DB::raw('DATE(sales.sold_at) as fecha'),
                    DB::raw('SUM(sale_details.subtotal) as ingreso'),
                    DB::raw('SUM(sale_details.quantity * batches.purchase_price) as costo')
                )
                ->groupBy(DB::raw('DATE(sales.sold_at)'))
                ->orderBy('fecha')
                ->get()
                ->keyBy(fn ($r) => Carbon::parse($r->fecha)->format('Y-m-d'));

            $result = [];
            $curr = $startDate->copy()->startOfDay();
            while ($curr->lte($endDate)) {
                $key = $curr->format('Y-m-d');
                $row = $rows->get($key);
                $ingreso = $row ? (float) $row->ingreso : 0.0;
                $costo = $row ? (float) $row->costo : 0.0;
                $result[] = [
                    'date'    => $key,
                    'label'   => $curr->locale('es')->isoFormat('D MMM'),
                    'ingreso' => round($ingreso, 2),
                    'costo'   => round($costo, 2),
                    'margen'  => round($ingreso - $costo, 2),
                ];
                $curr->addDay();
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('Error in margen_por_rango query: ' . $e->getMessage());
            return [];
        }
    }

    private function getComprasPorProveedor(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        try {
            return DB::table('purchases')
                ->join('suppliers', 'suppliers.id', '=', 'purchases.supplier_id')
                ->whereNull('purchases.deleted_at')
                ->whereBetween('purchases.purchase_date', [$startDate, $endDate])
                ->when($branchId, fn ($q) => $q->where('purchases.branch_id', $branchId))
                ->select(
                    'suppliers.id',
                    'suppliers.name',
                    DB::raw('SUM(purchases.total) as total')
                )
                ->groupBy('suppliers.id', 'suppliers.name')
                ->orderByDesc('total')
                ->limit(8)
                ->get()
                ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'total' => (float) $r->total])
                ->all();
        } catch (\Throwable $e) {
            Log::error('Error in compras_por_proveedor query: ' . $e->getMessage());
            return [];
        }
    }

    private function getRankingVendedores(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        try {
            return DB::table('sales')
                ->join('users', 'users.id', '=', 'sales.user_id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->whereBetween('sales.sold_at', [$startDate, $endDate])
                ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    'users.id',
                    DB::raw("TRIM(CONCAT(users.firstname, ' ', users.lastname)) as name"),
                    DB::raw('SUM(sales.total) as total_vendido'),
                    DB::raw('COUNT(sales.id) as cantidad_ventas')
                )
                ->groupBy('users.id', 'users.firstname', 'users.lastname')
                ->orderByDesc('total_vendido')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'id'               => $r->id,
                    'name'             => $r->name,
                    'total_vendido'    => (float) $r->total_vendido,
                    'cantidad_ventas'  => (int) $r->cantidad_ventas,
                ])
                ->all();
        } catch (\Throwable $e) {
            Log::error('Error in ranking_vendedores query: ' . $e->getMessage());
            return [];
        }
    }

    private function getLotesSemaforo(?int $branchId = null): array
    {
        try {
            $today = Carbon::today();

            $base = fn () => Batch::where('current_quantity', '>', 0)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

            $vencidos = (clone $base())->where('expiration_date', '<', $today)->count();
            $dias30 = (clone $base())->whereBetween('expiration_date', [$today, $today->copy()->addDays(30)])->count();
            $dias60 = (clone $base())->whereBetween('expiration_date', [$today->copy()->addDays(31), $today->copy()->addDays(60)])->count();
            $dias90 = (clone $base())->whereBetween('expiration_date', [$today->copy()->addDays(61), $today->copy()->addDays(90)])->count();
            $saludable = (clone $base())->where('expiration_date', '>', $today->copy()->addDays(90))->count();

            return [
                ['label' => 'Vencidos', 'value' => $vencidos],
                ['label' => '0-30 días', 'value' => $dias30],
                ['label' => '31-60 días', 'value' => $dias60],
                ['label' => '61-90 días', 'value' => $dias90],
                ['label' => 'Saludable (>90 días)', 'value' => $saludable],
            ];
        } catch (\Throwable $e) {
            Log::error('Error in lotes_semaforo query: ' . $e->getMessage());
            return [];
        }
    }

    private function getComprasVsVentas(?int $branchId = null): array
    {
        try {
            $result = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonthsNoOverflow($i);
                $start = $month->copy()->startOfMonth();
                $end = $month->copy()->endOfMonth();

                $ventas = (float) Sale::where('status', 'active')
                    ->whereBetween('sold_at', [$start, $end])
                    ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                    ->sum('total');

                $compras = (float) DB::table('purchases')
                    ->whereNull('deleted_at')
                    ->whereBetween('purchase_date', [$start, $end])
                    ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                    ->sum('total');

                $result[] = [
                    'label'   => $month->locale('es')->isoFormat('MMM YYYY'),
                    'ventas'  => round($ventas, 2),
                    'compras' => round($compras, 2),
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('Error in compras_vs_ventas query: ' . $e->getMessage());
            return [];
        }
    }

    private function getProductosBajaRotacion(?int $branchId = null): array
    {
        try {
            $since = Carbon::now()->subDays(90);

            $ventasSub = DB::table('sale_details')
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->whereColumn('sale_details.medicament_id', 'medicaments.id')
                ->where('sales.status', 'active')
                ->whereNull('sales.deleted_at')
                ->where('sales.sold_at', '>=', $since)
                ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
                ->selectRaw('COALESCE(SUM(sale_details.quantity), 0)');

            return DB::table('medicaments')
                ->where('medicaments.status', 'active')
                ->whereNull('medicaments.deleted_at')
                ->whereRaw(
                    '(SELECT COALESCE(SUM(current_quantity), 0) FROM batches WHERE batches.medicament_id = medicaments.id AND batches.deleted_at IS NULL'
                    . ($branchId ? ' AND batches.branch_id = ' . $branchId : '')
                    . ') > 0'
                )
                ->select('medicaments.id', 'medicaments.name', 'medicaments.code')
                ->selectSub($ventasSub, 'vendido_90_dias')
                ->orderBy('vendido_90_dias')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'id'                => $r->id,
                    'name'              => $r->name,
                    'code'              => $r->code,
                    'vendido_90_dias'   => (int) $r->vendido_90_dias,
                ])
                ->all();
        } catch (\Throwable $e) {
            Log::error('Error in productos_baja_rotacion query: ' . $e->getMessage());
            return [];
        }
    }

    private function getVentasPorDiaSemana(?int $branchId = null): array
    {
        try {
            $since = Carbon::now()->subDays(30);
            $labels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            $rows = DB::table('sales')
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->where('sold_at', '>=', $since)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->select(
                    DB::raw('EXTRACT(DOW FROM sold_at) as dow'),
                    DB::raw('SUM(total) as total')
                )
                ->groupBy(DB::raw('EXTRACT(DOW FROM sold_at)'))
                ->get()
                ->keyBy(fn ($r) => (int) $r->dow);

            $result = [];
            foreach ($labels as $dow => $label) {
                $row = $rows->get($dow);
                $result[] = [
                    'label' => $label,
                    'value' => $row ? round((float) $row->total, 2) : 0.0,
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('Error in ventas_por_dia_semana query: ' . $e->getMessage());
            return [];
        }
    }

    private function getVentasPorHoraDia(?int $branchId = null): array
    {
        try {
            $since = Carbon::now()->subDays(30);
            $dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

            $rows = DB::table('sales')
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->where('sold_at', '>=', $since)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->select(
                    DB::raw('EXTRACT(DOW FROM sold_at) as dow'),
                    DB::raw('EXTRACT(HOUR FROM sold_at) as hour'),
                    DB::raw('SUM(total) as total')
                )
                ->groupBy(DB::raw('EXTRACT(DOW FROM sold_at)'), DB::raw('EXTRACT(HOUR FROM sold_at)'))
                ->get()
                ->groupBy(fn ($r) => (int) $r->dow);

            $result = [];
            foreach ($dayLabels as $dow => $dayLabel) {
                $hoursForDay = $rows->get($dow, collect())->keyBy(fn ($r) => (int) $r->hour);
                $hours = [];
                for ($h = 0; $h < 24; $h++) {
                    $row = $hoursForDay->get($h);
                    $hours[] = round($row ? (float) $row->total : 0.0, 2);
                }
                $result[] = [
                    'day'   => $dayLabel,
                    'horas' => $hours,
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('Error in ventas_por_hora_dia query: ' . $e->getMessage());
            return [];
        }
    }
}
