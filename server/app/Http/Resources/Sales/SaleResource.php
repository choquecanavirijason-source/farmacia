<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'sold_at' => $this->sold_at?->toISOString(),
            'sale_date' => $this->sold_at?->toISOString(),
            'total' => (float) $this->total,
            'status' => $this->status,
            'client_id' => $this->client_id,
            'user_id' => $this->user_id,
            'cash_register_id' => $this->cash_register_id,
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id'   => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'client' => $this->whenLoaded('client', function () {
                return $this->client ? [
                    'id' => $this->client->id,
                    'firstname' => $this->client->firstname,
                    'lastname' => $this->client->lastname,
                    'ci' => $this->client->ci,
                    'nit' => $this->client->nit,
                    'phone' => $this->client->phone,
                    'address' => $this->client->address,
                ] : null;
            }),
            'invoice' => $this->whenLoaded('invoice'),
            'payments' => $this->whenLoaded('payments'),
            'details' => $this->whenLoaded('details', function () {
                return $this->details->map(function ($d) {
                    return [
                        'id' => $d->id,
                        'sale_id' => $d->sale_id,
                        'medicament_id' => $d->medicament_id,
                        'batch_id' => $d->batch_id,
                        'quantity' => (int) $d->quantity,
                        'unit_price' => (float) $d->unit_price,
                        'discount_percent' => (float) $d->discount_percent,
                        'subtotal' => (float) $d->subtotal,
                        'medicament' => $d->medicament ? [
                            'id' => $d->medicament->id,
                            'name' => $d->medicament->name,
                            'code' => $d->medicament->code,
                            'concentration' => $d->medicament->concentration,
                        ] : null,
                        'batch' => $d->batch ? [
                            'id' => $d->batch->id,
                            'batch_number' => $d->batch->batch_number,
                            'expiration_date' => $d->batch->expiration_date?->format('Y-m-d'),
                        ] : null,
                    ];
                });
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
