<?php

namespace App\Http\Resources\Marketplace;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'order_number'  => $this->order_number,
            'status'        => $this->status,
            'total'         => $this->total,
            'contact_name'  => $this->contact_name,
            'contact_phone' => $this->contact_phone,
            'notes'         => $this->notes,
            'branch'        => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id'   => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'created_at'    => $this->created_at,
            'details'       => $this->whenLoaded('details', fn () => $this->details->map(fn ($detail) => [
                'id'            => $detail->id,
                'medicament_id' => $detail->medicament_id,
                'name'          => $detail->medicament?->name,
                'image_url'     => $detail->medicament?->image_url,
                'quantity'      => $detail->quantity,
                'unit_price'    => $detail->unit_price,
                'subtotal'      => $detail->subtotal,
            ])),
        ];
    }
}
