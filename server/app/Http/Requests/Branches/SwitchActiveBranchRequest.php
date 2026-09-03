<?php

namespace App\Http\Requests\Branches;

use Illuminate\Foundation\Http\FormRequest;

class SwitchActiveBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => 'required|integer|exists:branches,id',
        ];
    }
}
