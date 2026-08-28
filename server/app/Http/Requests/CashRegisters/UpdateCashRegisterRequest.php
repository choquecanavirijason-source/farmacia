<?php

namespace App\Http\Requests\CashRegisters;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['opened_at' => 'required|date', 'opening_amount' => 'required|numeric|min:0', 'closed_at' => 'nullable|date', 'closing_amount' => 'nullable|numeric|min:0', 'expected_closing_amount' => 'nullable|numeric|min:0', 'status' => 'required|in:open,closed'];
    }
}
