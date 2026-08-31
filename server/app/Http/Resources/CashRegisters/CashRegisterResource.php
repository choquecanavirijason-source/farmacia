<?php

namespace App\Http\Resources\CashRegisters;

use Illuminate\Http\Resources\Json\JsonResource;

class CashRegisterResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
