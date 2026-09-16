<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Branches\AssignBranchUsersRequest;
use App\Http\Requests\Branches\StoreBranchRequest;
use App\Http\Requests\Branches\SwitchActiveBranchRequest;
use App\Http\Requests\Branches\UpdateBranchRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Branches\BranchResource;
use App\Models\Branch;
use App\Services\BranchService;
use App\Traits\ApiResponseTrait;
use App\Traits\Auth\AuthTrait;
use Illuminate\Http\Request;

class BranchController
{
    use ApiResponseTrait, AuthTrait;

    public function __construct(
        protected BranchService $branchService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['search', 'status']);

        $result = $this->branchService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(BranchResource::collection($result), 'Sucursales obtenidas con éxito.');
    }

    public function show(int $id)
    {
        $branch = Branch::withTrashed()->with('users')->findOrFail($id);
        return $this->resourceResponse(new BranchResource($branch), 'Sucursal obtenida con éxito.');
    }

    public function store(StoreBranchRequest $request)
    {
        $branch = $this->branchService->create($request->validated());
        return $this->createdResponse(new BranchResource($branch), 'Sucursal registrada con éxito.');
    }

    public function update(UpdateBranchRequest $request, int $id)
    {
        $branch = Branch::withTrashed()->findOrFail($id);
        $updatedBranch = $this->branchService->update($branch, $request->validated());
        return $this->updatedResponse(new BranchResource($updatedBranch), 'Sucursal actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->branchService->delete($id);
        return $this->deletedResponse('Sucursal eliminada con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->branchService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Sucursales eliminadas con éxito.');
    }

    public function restore(int $id)
    {
        $branch = $this->branchService->restore($id);
        return $this->updatedResponse(new BranchResource($branch), 'Sucursal restaurada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = $request->only(['search', 'status']);

        return $this->branchService->export(
            $format,
            $filters,
            (string) $request->query('sort_by', 'name'),
            (string) $request->query('sort_dir', 'asc')
        );
    }

    public function assignUsers(AssignBranchUsersRequest $request, int $id)
    {
        $branch = Branch::findOrFail($id);
        $branch = $this->branchService->assignUsers($branch, $request->validated('user_ids'));
        return $this->updatedResponse(new BranchResource($branch), 'Usuarios de la sucursal actualizados con éxito.');
    }

    public function switchActive(SwitchActiveBranchRequest $request)
    {
        $user = $this->branchService->switchActive($request->user(), (int) $request->validated('branch_id'));

        return $this->_generateResponse_($user->load('branches'));
    }
}
