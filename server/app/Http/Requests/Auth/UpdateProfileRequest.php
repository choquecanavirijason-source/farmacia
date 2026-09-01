<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'firstname'        => ['required', 'string', 'max:100'],
            'lastname'         => ['required', 'string', 'max:100'],
            'username'         => ['required', 'string', 'max:50', Rule::unique('users', 'username')->ignore($userId)],
            'email'            => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($userId)],
            'current_password' => ['required_with:password', 'nullable', 'string'],
            'password'         => ['nullable', 'string', 'min:6', 'confirmed'],
        ];
    }
}
