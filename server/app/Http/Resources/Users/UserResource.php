<?php

namespace App\Http\Resources\Users;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'firstname'   => $this->firstname,
            'lastname'    => $this->lastname,
            'username'    => $this->username,
            'email'       => $this->email,
            'state'       => $this->state,
            'roles'       => $this->whenLoaded('roles'),
            'role_names'  => $this->roles?->pluck('name') ?? [],
            'active_branch_id' => $this->active_branch_id,
            'branches'    => $this->whenLoaded('branches', function () {
                return $this->branches->map(fn ($b) => [
                    'id'         => $b->id,
                    'name'       => $b->name,
                    'is_default' => (bool) $b->pivot->is_default,
                ]);
            }),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
            'deleted_at'  => $this->deleted_at?->toISOString(),
        ];
    }
}
