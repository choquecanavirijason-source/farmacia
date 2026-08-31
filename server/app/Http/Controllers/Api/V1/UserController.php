<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\Users\UserResource;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;

class UserController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $result = User::withTrashed()
            ->with('roles')
            ->when($search !== '', fn ($query) => $query->search($search))
            ->filter($request->only(['state']))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->paginate(max(1, $request->integer('per_page', $request->integer('pageSize', 10))));

        return $this->collectionResponse(UserResource::collection($result), 'Usuarios obtenidos con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new UserResource(User::withTrashed()->with('roles')->findOrFail($id)), 'Usuario obtenido con éxito.');
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $role = $data['role'] ?? null;
        unset($data['role']);
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
        if ($role) {
            $user->assignRole($role);
        }

        return $this->createdResponse(new UserResource($user), 'Usuario registrado con éxito.');
    }

    public function update(UpdateUserRequest $request, int $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $data = $request->validated();
        $role = $data['role'] ?? null;
        unset($data['role']);
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        $user->update($data);
        if ($role) {
            $user->syncRoles([$role]);
        }

        return $this->updatedResponse(new UserResource($user->refresh()), 'Usuario actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        User::findOrFail($id)->delete();

        return $this->deletedResponse('Usuario eliminado con éxito.');
    }

    public function bulkDestroy(Request $request)
    {
        $users = User::whereIn('id', (array) $request->ids)->get();
        foreach ($users as $user) {
            $user->delete();
        }

        return $this->deletedResponse('Usuarios eliminados con éxito.');
    }

    public function restore(int $id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return $this->updatedResponse(new UserResource($user), 'Usuario restaurado con éxito.');
    }

    public function export(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $items = User::withTrashed()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->sort(
                (string) $request->query('sort_by', 'name'),
                (string) $request->query('sort_dir', 'asc')
            )
            ->get();

        return strtolower((string) $request->query('format', 'excel')) === 'pdf'
            ? $this->exportPdf($items)
            : $this->exportExcel($items);
    }

    private function exportExcel($items)
    {
        return Excel::download(new RecordsExport($items, [
            'Nombre'   => 'name',
            'Email'    => 'email',
            'Estado'   => 'state',
        ]), 'usuarios.xlsx');
    }

    private function exportPdf($items)
    {
        return Pdf::loadView('exports.records', [
            'title'   => 'Reporte de Usuarios',
            'columns' => [
                'Nombre' => 'name',
                'Email'  => 'email',
                'Estado' => 'state',
            ],
            'records' => $items,
        ])->download('usuarios.pdf');
    }
}
