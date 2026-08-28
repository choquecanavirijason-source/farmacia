<?php

namespace App\Http\Requests\Laboratories;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLaboratoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'required|string|max:255', 'country' => 'nullable|string|max:255', 'phone' => 'nullable|string|max:255'];
    }
}
