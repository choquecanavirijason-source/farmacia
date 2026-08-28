<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\Users\UserResource;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return UserResource::collection(User::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->filter($request->only(['state']))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function show(int $id)
    {
        return new UserResource(User::findOrFail($id));
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

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, int $id)
    {
        $user = User::findOrFail($id);
        $data = $request->validated();
        $role = $data['role'] ?? null;
        unset($data['role']);
        $user->update($data);
        if ($role) {
            $user->syncRoles([$role]);
        }

        return new UserResource($user->refresh());
    }

    public function destroy(int $id)
    {
        User::findOrFail($id)->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function export(Request $request)
    {
        $items = User::orderBy('name')->get();
        $columns = ['Name' => 'name', 'Email' => 'email', 'First name' => 'firstname', 'Last name' => 'lastname', 'State' => 'state'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Users', 'columns' => $columns, 'records' => $items])->download('users.pdf');
        }

        return Excel::download(new RecordsExport($items, $columns), 'users.xlsx');
    }
}
