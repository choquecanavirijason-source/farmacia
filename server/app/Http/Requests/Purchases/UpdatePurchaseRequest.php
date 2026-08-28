<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['invoice_number' => 'required|string|max:60', 'purchase_date' => 'required|date', 'total' => 'required|numeric|min:0', 'supplier_id' => 'required|exists:suppliers,id'];
    }
}
