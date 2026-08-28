<?php

namespace App\Http\Resources\Medicaments;

use Illuminate\Http\Resources\Json\JsonResource;

class MedicamentResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
