<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'firstname' => 'required|string|max:120',
            'lastname'  => 'required|string|max:120',
            'username'  => 'nullable|string|max:100|unique:users,username',
            'email'     => 'required|email|max:255|unique:users,email',
            'password'  => 'required|string|min:6',
            'role'              => 'nullable|string',
            'roles'             => 'nullable|array',
            'branch_ids'        => 'nullable|array',
            'branch_ids.*'      => 'integer|exists:branches,id',
            'default_branch_id' => 'nullable|integer|exists:branches,id',
        ];
    }
}
