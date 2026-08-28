<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => 'required|integer|exists:clients,id',
            'user_id' => 'required|integer|exists:users,id',
            'cash_register_id' => 'required|integer|exists:cash_registers,id',
            'forma_pago' => 'required|string|max:40',
            'nit_cliente' => 'nullable|string|max:30',
            'razon_social' => 'nullable|string|max:150',
            'items' => 'required|array|min:1',
            'items.*.medicament_id' => 'required|integer|exists:medicaments,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'Selecciona un cliente.',
            'forma_pago.required' => 'Selecciona la forma de pago.',
            'items.min' => 'Agrega al menos un producto a la venta.',
            'items.*.medicament_id.exists' => 'Uno de los productos ya no existe.',
            'items.*.quantity.min' => 'La cantidad de cada producto debe ser mayor a cero.',
            'items.*.unit_price.min' => 'El precio unitario no puede ser negativo.',
        ];
    }
}
