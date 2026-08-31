export type KardexType = "entrada" | "salida" | "ajuste" | "in" | "out" | "adjustment";

export const ADJUSTMENT_REASONS = [
  "Vencimiento",
  "Daño",
  "Extravío",
  "Otro",
] as const;

export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];

export interface IKardexMovement {
  id: number;
  batch_id: number;
  type: KardexType;
  quantity: number;
  balance: number;
  reason: string;
  occurred_at: string;
  batch_number?: string;
}

export interface IKardexMovementWithBatch extends IKardexMovement {
  batch_number: string;
}
