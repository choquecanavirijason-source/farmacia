<?php

namespace App\Http\Resources\Batches;

use Illuminate\Http\Resources\Json\JsonResource;

class BatchResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
