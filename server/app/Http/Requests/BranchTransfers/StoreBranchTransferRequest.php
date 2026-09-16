<?php

namespace App\Http\Requests\BranchTransfers;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'batch_id'     => 'required|integer|exists:batches,id',
            'to_branch_id' => 'required|integer|exists:branches,id',
            'quantity'     => 'required|integer|min:1',
            'reason'       => 'nullable|string|max:150',
        ];
    }
}
