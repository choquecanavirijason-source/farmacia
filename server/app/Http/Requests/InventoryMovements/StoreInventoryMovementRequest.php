<?php

namespace App\Http\Requests\InventoryMovements;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['batch_id' => 'required|exists:batches,id', 'type' => 'required|in:in,out,adjustment', 'quantity' => 'required|integer', 'balance' => 'required|integer', 'reason' => 'required|string|max:150', 'occurred_at' => 'required|date'];
    }
}
