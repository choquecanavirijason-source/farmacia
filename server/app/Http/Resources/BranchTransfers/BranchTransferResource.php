<?php

namespace App\Http\Resources\BranchTransfers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchTransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'medicament_id'      => $this->medicament_id,
            'from_branch_id'     => $this->from_branch_id,
            'to_branch_id'       => $this->to_branch_id,
            'source_batch_id'    => $this->source_batch_id,
            'destination_batch_id' => $this->destination_batch_id,
            'quantity'           => $this->quantity,
            'reason'             => $this->reason,
            'medicament'         => $this->whenLoaded('medicament', fn () => [
                'id'   => $this->medicament->id,
                'name' => $this->medicament->name,
                'code' => $this->medicament->code,
            ]),
            'from_branch'        => $this->whenLoaded('fromBranch', fn () => [
                'id'   => $this->fromBranch->id,
                'name' => $this->fromBranch->name,
            ]),
            'to_branch'          => $this->whenLoaded('toBranch', fn () => [
                'id'   => $this->toBranch->id,
                'name' => $this->toBranch->name,
            ]),
            'created_at'         => $this->created_at?->toISOString(),
        ];
    }
}
