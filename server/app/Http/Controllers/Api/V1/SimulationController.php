<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\SimulationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class SimulationController
{
    use ApiResponseTrait;

    public function __construct(
        protected SimulationService $simulationService
    ) {}

    public function latest(Request $request)
    {
        $currentUser = $request->user();
        if (!$this->simulationService->isPrincipalAdmin($currentUser)) {
            return $this->errorResponse('Acceso denegado.', 403);
        }

        $latest = $this->simulationService->getLatest();
        if (!$latest) {
            return $this->successResponse(null, 'No hay simulaciones previas registradas.');
        }

        return $this->successResponse([
            'id' => $latest->id,
            'start_date' => $latest->start_date?->format('Y-m-d'),
            'end_date' => $latest->end_date?->format('Y-m-d'),
            'status' => $latest->status,
            'summary' => $latest->attributes['summary'] ?? null,
            'generated_users' => $latest->attributes['generated_users'] ?? [],
            'params' => $latest->attributes['params'] ?? null,
            'created_at' => $latest->created_at?->toISOString(),
        ], 'Última simulación obtenida con éxito.');
    }

    public function run(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'sellers_count' => 'nullable|integer|min:1|max:15',
            'supervisors_count' => 'nullable|integer|min:0|max:5',
            'admins_count' => 'nullable|integer|min:0|max:5',
            'min_daily_sales' => 'nullable|integer|min:1|max:30',
            'max_daily_sales' => 'nullable|integer|min:1|max:50',
            'reset_data' => 'nullable|boolean',
        ]);

        $currentUser = $request->user();
        $result = $this->simulationService->run($validated, $currentUser);

        return $this->successResponse($result, 'Simulación y regeneración de datos completada exitosamente.');
    }
}
