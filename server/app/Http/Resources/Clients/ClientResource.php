<?php

namespace App\Http\Resources\Clients;

use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
