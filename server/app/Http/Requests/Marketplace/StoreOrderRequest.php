<?php

namespace App\Http\Requests\Marketplace;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contact_name'  => 'required|string|max:255',
            'contact_phone' => 'required|string|max:20',
            'notes'         => 'nullable|string|max:255',
            'items'                    => 'required|array|min:1',
            'items.*.medicament_id'    => 'required|integer|exists:medicaments,id',
            'items.*.quantity'         => 'required|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'contact_name.required'  => 'El nombre de contacto es obligatorio.',
            'contact_phone.required' => 'El teléfono de contacto es obligatorio.',
            'items.required'         => 'El carrito no puede estar vacío.',
            'items.min'              => 'El carrito no puede estar vacío.',
        ];
    }
}
