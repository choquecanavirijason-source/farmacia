<?php

namespace App\Http\Resources\Laboratories;

use Illuminate\Http\Resources\Json\JsonResource;

class LaboratoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
