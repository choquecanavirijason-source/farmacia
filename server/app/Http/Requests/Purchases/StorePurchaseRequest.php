<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'invoice_number' => 'required|string|max:60',
            'purchase_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.medicament_id' => 'required|integer|exists:medicaments,id',
            'items.*.batch_number' => 'required|string|max:60',
            'items.*.expiration_date' => 'required|date',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'items.min' => 'Agrega al menos un medicamento a la compra.',
            'items.*.quantity.min' => 'La cantidad de cada línea debe ser mayor a cero.',
            'items.*.unit_price.min' => 'El precio unitario no puede ser negativo.',
        ];
    }
}
