<?php

namespace App\Http\Requests\Invoices;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['sale_id' => 'required|exists:sales,id', 'invoice_number' => 'required|string|max:30', 'client_tax_id' => 'required|string|max:30', 'business_name' => 'required|string|max:150', 'issued_at' => 'required|date', 'total' => 'required|numeric|min:0'];
    }
}
