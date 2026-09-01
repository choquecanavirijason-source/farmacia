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
        $filters = $request->only(['start_date', 'end_date']);
        $stats = $this->dashboardService->getStats($filters);
        return $this->successResponse($stats, 'Estadísticas obtenidas con éxito.');
    }
}
