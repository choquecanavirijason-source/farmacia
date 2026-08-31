<?php

namespace App\Http\Requests\Batches;

use Illuminate\Foundation\Http\FormRequest;

class StoreBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['batch_number' => 'required|string|max:60', 'expiration_date' => 'required|date', 'current_quantity' => 'required|integer|min:0', 'purchase_price' => 'required|numeric|min:0', 'medicament_id' => 'required|exists:medicaments,id'];
    }
}
