<?php

namespace App\Http\Resources\Auth\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'state' => $this->state,
            'roles' => $this->roles ? $this->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name]) : [],
            'active_branch_id' => $this->active_branch_id,
            'branches' => $this->relationLoaded('branches')
                ? $this->branches->map(fn ($b) => ['id' => $b->id, 'name' => $b->name])
                : [],
        ];
    }
}
