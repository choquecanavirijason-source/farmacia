<?php

namespace App\Http\Resources\Branches;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'status' => $this->status,
            'users' => $this->whenLoaded('users', fn () => $this->users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'is_default' => (bool) $u->pivot->is_default,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
