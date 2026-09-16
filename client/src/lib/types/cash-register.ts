import type { IUser } from "./user";

export type CashRegisterStatus = "open" | "closed" | "abierta" | "cerrada";

export type CashMovementType = "ingreso" | "egreso" | "in" | "out";

export interface ICashMovement {
  id: number;
  cash_register_id: number;
  type: CashMovementType;
  amount: number;
  concept: string;
  movement_date: string;
  created_at?: string;
}

export interface ICashRegister {
  id: number;
  opening_date: string;
  opening_amount: number;
  closing_date: string | null;
  closing_amount: number | null;
  expected_closing_amount: number | null;
  status: CashRegisterStatus;
  user_id?: number;
  user?: IUser;
  movements?: ICashMovement[];
  branch_id?: number;
  branch?: { id: number; name: string };
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

export interface IOpenCashRegisterRequest {
  opening_amount: number;
}

export interface ICloseCashRegisterRequest {
  closing_amount: number;
}

export interface ICashMovementRequest {
  type: "ingreso" | "egreso";
  amount: number;
  concept: string;
}
