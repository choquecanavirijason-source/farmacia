<?php

namespace App\Http\Resources\InventoryMovements;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryMovementResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
