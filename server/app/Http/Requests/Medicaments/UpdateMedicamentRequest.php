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
        return ['code' => 'required|string|max:255', 'name' => 'required|string|max:255', 'concentration' => 'nullable|string|max:255', 'price' => 'required|numeric|min:0', 'min_stock' => 'required|integer|min:0', 'requires_prescription' => 'required|boolean', 'status' => 'required|in:active,inactive', 'laboratory_id' => 'required|exists:laboratories,id', 'category_id' => 'required|exists:categories,id', 'presentation_id' => 'required|exists:presentations,id'];
    }
}
