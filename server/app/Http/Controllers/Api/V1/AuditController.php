<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Audits\AuditResource;
use App\Services\AuditService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class AuditController
{
    use ApiResponseTrait;

    public function __construct(
        protected AuditService $auditService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->only(['search', 'period', 'date_from', 'date_to', 'event', 'model']);
        $result = $this->auditService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('created_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(AuditResource::collection($result), 'Auditorías obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $audit = $this->auditService->getById($id);
        return $this->resourceResponse(new AuditResource($audit), 'Auditoría obtenida con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = $request->only(['search', 'period', 'date_from', 'date_to', 'event', 'model']);

        return $this->auditService->export($format, $filters);
    }
}
