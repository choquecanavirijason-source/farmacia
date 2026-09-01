<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id') ?? $this->route('usuario') ?? $this->route('user');

        return [
            'firstname' => 'sometimes|required|string|max:120',
            'lastname'  => 'sometimes|required|string|max:120',
            'username'  => 'nullable|string|max:100|unique:users,username,'.$userId,
            'email'     => 'sometimes|required|email|max:255|unique:users,email,'.$userId,
            'password'  => 'nullable|string|min:6',
            'role'      => 'nullable|string',
            'roles'     => 'nullable|array',
        ];
    }
}
