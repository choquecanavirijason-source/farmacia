<?php

namespace App\Http\Resources\Marketplace;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        $totalStock = (int) ($this->total_stock ?? 0);

        return [
            'id'                     => $this->id,
            'code'                   => $this->code,
            'name'                   => $this->name,
            'concentration'          => $this->concentration,
            'price'                  => $this->price,
            'requires_prescription'  => $this->requires_prescription,
            'image_url'              => $this->image_url,
            'total_stock'            => $totalStock,
            'in_stock'               => $totalStock > 0,
            'category'               => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),
            'presentation'           => $this->whenLoaded('presentation', fn () => [
                'id'   => $this->presentation->id,
                'name' => $this->presentation->name,
            ]),
            'laboratory'             => $this->whenLoaded('laboratory', fn () => [
                'id'   => $this->laboratory->id,
                'name' => $this->laboratory->name,
            ]),
        ];
    }
}
