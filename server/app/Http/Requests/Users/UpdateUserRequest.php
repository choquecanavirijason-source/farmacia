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
        return ['name' => 'required|string|max:255', 'email' => 'required|email|max:255', 'firstname' => 'required|string|max:120', 'lastname' => 'required|string|max:120', 'password' => 'nullable|string|min:8', 'state' => 'required|in:active,inactive', 'role' => 'nullable|exists:roles,name'];
    }
}
