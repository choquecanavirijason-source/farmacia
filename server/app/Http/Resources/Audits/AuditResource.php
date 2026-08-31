<?php

namespace App\Http\Resources\Audits;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'user_type'      => $this->user_type,
            'user_id'        => $this->user_id,
            'user'           => $this->user ? [
                'id'        => $this->user->id,
                'name'      => $this->user->name,
                'firstname' => $this->user->firstname ?? '',
                'lastname'  => $this->user->lastname ?? '',
                'email'     => $this->user->email,
            ] : null,
            'event'          => $this->event,
            'auditable_type' => class_basename($this->auditable_type),
            'auditable_type_full' => $this->auditable_type,
            'auditable_id'   => $this->auditable_id,
            'old_values'     => $this->old_values,
            'new_values'     => $this->new_values,
            'url'            => $this->url,
            'ip_address'     => $this->ip_address,
            'user_agent'     => $this->user_agent,
            'tags'           => $this->tags,
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}
