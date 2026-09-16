<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\DashboardService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class DashboardController
{
    use ApiResponseTrait;

    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function stats(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        $stats = $this->dashboardService->getStats($filters);
        return $this->successResponse($stats, 'Estadísticas obtenidas con éxito.');
    }

    public function salesSummary(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        $summary = $this->dashboardService->getSalesSummary($filters);
        return $this->successResponse($summary, 'Resumen de ventas obtenido con éxito.');
    }

    public function ventasTendencia(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        return $this->successResponse($this->dashboardService->getVentasTendencia($filters), 'Tendencia de ventas obtenida con éxito.');
    }

    public function rankingVendedores(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        return $this->successResponse($this->dashboardService->getRankingVendedoresReport($filters), 'Ranking de vendedores obtenido con éxito.');
    }

    public function topProductos(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        return $this->successResponse($this->dashboardService->getTopProductosReport($filters), 'Top de productos obtenido con éxito.');
    }

    public function ventasPorCategoria(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        return $this->successResponse($this->dashboardService->getVentasPorCategoriaReport($filters), 'Ventas por categoría obtenidas con éxito.');
    }

    public function ventasPorMetodoPago(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        return $this->successResponse($this->dashboardService->getVentasPorMetodoPagoReport($filters), 'Ventas por método de pago obtenidas con éxito.');
    }

    public function margenBruto(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date', 'branch_id']);
        return $this->successResponse($this->dashboardService->getMargenBrutoReport($filters), 'Margen bruto obtenido con éxito.');
    }
}
