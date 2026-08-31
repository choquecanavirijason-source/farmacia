<?php

namespace App\Http\Requests\Medicaments;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicamentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code'                  => 'sometimes|required|string|max:255',
            'name'                  => 'sometimes|required|string|max:255',
            'concentration'         => 'sometimes|nullable|string|max:255',
            'price'                 => 'sometimes|required|numeric|min:0',
            'min_stock'             => 'sometimes|required|integer|min:0',
            'requires_prescription' => 'sometimes|required|boolean',
            'status'                => 'sometimes|required|in:active,inactive',
            'laboratory_id'         => 'sometimes|required|exists:laboratories,id',
            'category_id'           => 'sometimes|required|exists:categories,id',
            'presentation_id'       => 'sometimes|required|exists:presentations,id',
        ];
    }
}
