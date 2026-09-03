<?php

namespace App\Http\Resources\Purchases;

use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'invoice_number' => $this->invoice_number,
            'purchase_date'  => $this->purchase_date?->format('Y-m-d'),
            'total'          => (float) $this->total,
            'supplier_id'    => $this->supplier_id,
            'branch_id'      => $this->branch_id,
            'branch'         => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id'   => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'supplier'       => $this->whenLoaded('supplier', function () {
                return $this->supplier ? [
                    'id'      => $this->supplier->id,
                    'name'    => $this->supplier->name,
                    'nit'     => $this->supplier->nit,
                    'phone'   => $this->supplier->phone,
                    'address' => $this->supplier->address,
                    'email'   => $this->supplier->email,
                ] : null;
            }),
            'details'        => $this->whenLoaded('details'),
            'created_at'     => $this->created_at?->toISOString(),
            'updated_at'     => $this->updated_at?->toISOString(),
        ];
    }
}
