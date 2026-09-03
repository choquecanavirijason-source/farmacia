<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\Users\UserResource;
use App\Models\User;
use App\Services\UserService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class UserController
{
    use ApiResponseTrait;

    public function __construct(
        protected UserService $userService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = [
            'search' => $request->getSearch(),
            'status' => $request->query('status', 'active'),
            'role'   => $request->query('role'),
        ];

        $result = $this->userService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(UserResource::collection($result), 'Usuarios obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $user = User::withTrashed()->with('roles', 'branches')->findOrFail($id);
        return $this->resourceResponse(new UserResource($user), 'Usuario obtenido con éxito.');
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->create($request->validated());
        return $this->createdResponse(new UserResource($user), 'Usuario registrado con éxito.');
    }

    public function update(UpdateUserRequest $request, int $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $updatedUser = $this->userService->update($user, $request->validated());
        return $this->updatedResponse(new UserResource($updatedUser), 'Usuario actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->userService->delete($id, auth()->id());
        return $this->deletedResponse('Usuario enviado a la papelera con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->userService->bulkDelete((array) $request->ids, auth()->id());
        return $this->deletedResponse('Usuarios seleccionados eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $user = $this->userService->restore($id);
        return $this->updatedResponse(new UserResource($user), 'Usuario restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        $filters = [
            'search'   => $request->query('search'),
            'status'   => $request->query('status', 'active'),
            'role'     => $request->query('role'),
            'sort_by'  => $request->query('sort_by', 'name'),
            'sort_dir' => $request->query('sort_dir', 'asc'),
        ];

        return $this->userService->export($format, $filters);
    }
}
