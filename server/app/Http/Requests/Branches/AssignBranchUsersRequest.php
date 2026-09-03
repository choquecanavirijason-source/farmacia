<?php

namespace App\Http\Requests\Branches;

use Illuminate\Foundation\Http\FormRequest;

class AssignBranchUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_ids' => 'present|array',
            'user_ids.*' => 'integer|exists:users,id',
        ];
    }
}
