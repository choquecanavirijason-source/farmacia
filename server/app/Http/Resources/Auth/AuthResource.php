<?php

namespace App\Http\Resources\Auth;

use App\Http\Resources\Auth\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'access_token' => $this->access_token,
            'expires_at' => $this->expires_at,
            'user' => new UserResource($this->user),
            'permissions' => $this->permissions,
        ];
    }
}
