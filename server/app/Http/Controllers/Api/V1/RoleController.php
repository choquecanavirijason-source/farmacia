<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Roles\StoreRoleRequest;
use App\Http\Requests\Roles\UpdateRoleRequest;
use App\Http\Resources\Roles\RoleResource;
use App\Services\RoleService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController
{
    use ApiResponseTrait;

    public function __construct(
        protected RoleService $roleService
    ) {}

    public function index(PaginationRequest $request)
    {
        $result = $this->roleService->getPaginated(
            $request->getSearch(),
            $request->getPerPage(10),
            $request->getSortBy('id'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(RoleResource::collection($result), 'Roles obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $role = Role::where('guard_name', 'api')->with('permissions')->withCount('users')->findOrFail($id);
        return $this->resourceResponse(new RoleResource($role), 'Rol obtenido con éxito.');
    }

    public function store(StoreRoleRequest $request)
    {
        $role = $this->roleService->create($request->validated());
        return $this->createdResponse(new RoleResource($role), 'Rol creado con éxito.');
    }

    public function update(UpdateRoleRequest $request, int $id)
    {
        $role = Role::where('guard_name', 'api')->findOrFail($id);
        $updatedRole = $this->roleService->update($role, $request->validated());
        return $this->updatedResponse(new RoleResource($updatedRole), 'Rol actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->roleService->delete($id);
        return $this->deletedResponse('Rol eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->roleService->bulkDelete((array) $request->ids);
        return $this->deletedResponse('Roles seleccionados eliminados con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = [
            'search'   => $request->query('search'),
            'sort_by'  => $request->query('sort_by', 'id'),
            'sort_dir' => $request->query('sort_dir', 'asc'),
        ];
        return $this->roleService->export($format, $filters);
    }

    public function permissions()
    {
        $permissions = Permission::where('guard_name', 'api')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'guard_name']);

        return $this->successResponse($permissions, 'Permisos obtenidos con éxito.');
    }
}
