<?php

namespace App\Http\Resources\Auth;

use App\Http\Resources\Auth\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user' => new UserResource($this->user),
            'permissions' => $this->permissions,
        ];
    }
}
