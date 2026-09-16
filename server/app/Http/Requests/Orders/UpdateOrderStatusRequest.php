<?php

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'    => 'required|string|in:confirmed,ready,completed,cancelled',
            'branch_id' => 'required_if:status,confirmed|integer|exists:branches,id',
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required_if' => 'Debes elegir la sucursal que va a preparar el pedido.',
        ];
    }
}
