<?php

namespace App\Http\Resources\Audits;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditResource extends JsonResource
{
    /** Cache en memoria del request: evita una consulta de sucursal por cada fila de la página. */
    private static ?array $branchNamesById = null;

    private function resolveBranchId(): ?int
    {
        // Un evento "updated" solo guarda los campos que cambiaron: si branch_id no fue uno
        // de ellos (ej. una venta que solo actualiza `current_quantity` de un lote), no aparece
        // en el diff aunque el registro sí pertenezca a una sucursal. En ese caso se resuelve
        // consultando el modelo real — branch_id nunca cambia una vez creado el registro.
        $branchId = data_get($this->new_values, 'branch_id') ?? data_get($this->old_values, 'branch_id');

        if (!$branchId && $this->relationLoaded('auditable') && $this->auditable) {
            $branchId = $this->auditable->branch_id ?? null;
        }

        return $branchId ? (int) $branchId : null;
    }

    /** Descripción legible del registro afectado (ej. "Paracetamol 500 mg — Lote LOT-002"),
     * porque un ID crudo ("Lote #34") no le dice nada a quien revisa la auditoría. */
    private function resolveSubjectLabel(): ?string
    {
        if (!$this->relationLoaded('auditable') || !$this->auditable) {
            return null;
        }

        $model = $this->auditable;

        return match (class_basename($model)) {
            'Batch'        => trim(($model->medicament->name ?? 'Medicamento') . ' — Lote ' . $model->batch_number),
            'Sale'         => 'Venta #' . $model->id,
            'Purchase'     => 'Compra ' . ($model->invoice_number ?: '#' . $model->id),
            'CashRegister' => 'Caja #' . $model->id,
            'Client'       => trim(($model->firstname ?? '') . ' ' . ($model->lastname ?? '')) ?: null,
            'User', 'Medicament', 'Branch', 'Supplier', 'Category', 'Laboratory', 'Presentation' => $model->name ?? null,
            default        => null,
        };
    }

    private function resolveBranchName(?int $branchId): ?string
    {
        if (!$branchId) {
            return null;
        }

        if (self::$branchNamesById === null) {
            self::$branchNamesById = Branch::withTrashed()->pluck('name', 'id')->all();
        }

        return self::$branchNamesById[$branchId] ?? null;
    }

    public function toArray(Request $request): array
    {
        $branchId = $this->resolveBranchId();

        return [
            'id'             => $this->id,
            'user_type'      => $this->user_type,
            'user_id'        => $this->user_id,
            'user'           => $this->user ? [
                'id'        => $this->user->id,
                'name'      => $this->user->name,
                'firstname' => $this->user->firstname ?? '',
                'lastname'  => $this->user->lastname ?? '',
                'email'     => $this->user->email,
            ] : null,
            'event'          => $this->event,
            'auditable_type' => class_basename($this->auditable_type),
            'auditable_type_full' => $this->auditable_type,
            'auditable_id'   => $this->auditable_id,
            'subject_label'  => $this->resolveSubjectLabel(),
            'branch_id'      => $branchId,
            'branch'         => $branchId ? [
                'id'   => $branchId,
                'name' => $this->resolveBranchName($branchId),
            ] : null,
            'old_values'     => $this->old_values,
            'new_values'     => $this->new_values,
            'url'            => $this->url,
            'ip_address'     => $this->ip_address,
            'user_agent'     => $this->user_agent,
            'tags'           => $this->tags,
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}
