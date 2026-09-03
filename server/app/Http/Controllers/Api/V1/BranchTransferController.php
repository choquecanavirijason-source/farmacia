<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\BranchTransfers\StoreBranchTransferRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\BranchTransfers\BranchTransferResource;
use App\Services\BranchTransferService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class BranchTransferController
{
    use ApiResponseTrait;

    public function __construct(
        protected BranchTransferService $branchTransferService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['medicament_id', 'from_branch_id', 'to_branch_id', 'branch_id']);

        $result = $this->branchTransferService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('created_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(BranchTransferResource::collection($result), 'Traspasos obtenidos con éxito.');
    }

    public function store(StoreBranchTransferRequest $request)
    {
        $data = $request->validated();

        $transfer = $this->branchTransferService->transfer(
            (int) $data['batch_id'],
            (int) $data['to_branch_id'],
            (int) $data['quantity'],
            $data['reason'] ?? null,
            (int) $request->user()->id,
            (int) $request->user()->active_branch_id
        );

        return $this->createdResponse(new BranchTransferResource($transfer), 'Traspaso registrado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = $request->only(['medicament_id', 'from_branch_id', 'to_branch_id']);

        return $this->branchTransferService->export(
            $format,
            $filters,
            (string) $request->query('sort_by', 'created_at'),
            (string) $request->query('sort_dir', 'desc')
        );
    }
}
