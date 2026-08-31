<?php

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'firstname' => 'sometimes|required|string|max:255',
            'lastname'  => 'sometimes|nullable|string|max:255',
            'ci'        => 'nullable|string|max:255',
            'nit'       => 'nullable|string|max:255',
            'phone'     => 'nullable|string|max:255',
            'address'   => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'firstname.required' => 'El nombre del cliente es obligatorio.',
        ];
    }
}
