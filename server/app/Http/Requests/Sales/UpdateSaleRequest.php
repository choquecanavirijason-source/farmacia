<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['sold_at' => 'required|date', 'total' => 'required|numeric|min:0', 'status' => 'required|in:active,voided', 'client_id' => 'nullable|exists:clients,id', 'user_id' => 'required|exists:users,id', 'cash_register_id' => 'required|exists:cash_registers,id'];
    }
}
