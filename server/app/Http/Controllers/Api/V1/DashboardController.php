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
        $stats = $this->dashboardService->getStats();
        return $this->successResponse($stats, 'Estadísticas del panel principal obtenidas con éxito.');
    }
}
