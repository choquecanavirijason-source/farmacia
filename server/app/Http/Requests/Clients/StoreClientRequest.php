<?php

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['firstname' => 'required|string|max:255', 'lastname' => 'required|string|max:255', 'ci' => 'nullable|string|max:255', 'nit' => 'nullable|string|max:255', 'phone' => 'nullable|string|max:255', 'address' => 'nullable|string|max:255'];
    }
}
