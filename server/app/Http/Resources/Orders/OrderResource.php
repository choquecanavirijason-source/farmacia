<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'order_number'  => $this->order_number,
            'status'        => $this->status,
            'total'         => (float) $this->total,
            'contact_name'  => $this->contact_name,
            'contact_phone' => $this->contact_phone,
            'notes'         => $this->notes,
            'confirmed_at'  => $this->confirmed_at?->toISOString(),
            'completed_at'  => $this->completed_at?->toISOString(),
            'created_at'    => $this->created_at?->toISOString(),
            'customer'      => $this->whenLoaded('user', fn () => $this->user ? [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'branch'        => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id'   => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'details'       => $this->whenLoaded('details', fn () => $this->details->map(fn ($detail) => [
                'id'            => $detail->id,
                'medicament_id' => $detail->medicament_id,
                'name'          => $detail->medicament?->name,
                'quantity'      => $detail->quantity,
                'unit_price'    => (float) $detail->unit_price,
                'subtotal'      => (float) $detail->subtotal,
            ])),
        ];
    }
}
