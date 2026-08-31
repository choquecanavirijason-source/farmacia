<?php

namespace App\Http\Requests\CashRegisters;

use Illuminate\Foundation\Http\FormRequest;

class StoreCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['opening_amount' => 'required|numeric|min:0'];
    }
}
