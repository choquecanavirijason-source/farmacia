<?php

namespace App\Http\Resources\Medicaments;

use Illuminate\Http\Resources\Json\JsonResource;

class MedicamentResource extends JsonResource
{
    public function toArray($request): array
    {
        $totalStock = (int) ($this->total_stock ?? $this->batches?->sum('current_quantity') ?? 0);

        return array_merge(parent::toArray($request), [
            'total_stock'  => $totalStock,
            'stock_actual' => $totalStock,
            'category'     => $this->whenLoaded('category'),
            'presentation' => $this->whenLoaded('presentation'),
            'laboratory'   => $this->whenLoaded('laboratory'),
            'batches'      => $this->whenLoaded('batches'),
        ]);
    }
}
