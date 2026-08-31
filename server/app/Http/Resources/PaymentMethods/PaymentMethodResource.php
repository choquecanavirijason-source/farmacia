<?php

namespace App\Http\Resources\PaymentMethods;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
