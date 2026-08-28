<?php

namespace App\Http\Requests\Companies;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'required|string|max:255', 'nit' => 'required|string|max:255', 'address' => 'nullable|string|max:255', 'phone' => 'nullable|string|max:255', 'email' => 'nullable|email|max:255', 'logo_path' => 'nullable|string'];
    }
}
