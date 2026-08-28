<?php

namespace App\Http\Resources\Presentations;

use Illuminate\Http\Resources\Json\JsonResource;

class PresentationResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
