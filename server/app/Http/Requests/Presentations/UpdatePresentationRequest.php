<?php

namespace App\Http\Requests\Presentations;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePresentationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:255',
        ];
    }
}
