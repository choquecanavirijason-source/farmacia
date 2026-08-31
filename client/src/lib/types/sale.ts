import type { IClient } from "./client";
import type { IUser } from "./user";
import type { IMedicament } from "./medicament";
import type { IBatch } from "./batch";

export const PAYMENT_METHODS = [
  "Efectivo",
  "Tarjeta",
  "QR",
  "Transferencia",
] as const;

export type PaymentMethodName = (typeof PAYMENT_METHODS)[number];

export type SaleStatus = "active" | "voided" | "activa" | "anulada";

export interface ISaleDetail {
  id: number;
  sale_id: number;
  medicament_id: number;
  batch_id: number;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  subtotal: number;
  medicament?: IMedicament;
  batch?: IBatch;
}

export interface IInvoice {
  id: number;
  sale_id: number;
  invoice_number: string;
  client_tax_id: string;
  business_name: string;
  issued_at: string;
  total: number;
}

export interface ISale {
  id: number;
  sale_date: string;
  total: number;
  status: SaleStatus;
  client_id: number;
  user_id: number;
  cash_register_id: number;
  payment_method_id?: number;
  payment_method?: string;
  client?: IClient;
  user?: IUser;
  details?: ISaleDetail[];
  invoice?: IInvoice;
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

export interface ISaleItemRequest {
  medicament_id: number;
  batch_id?: number;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
}

export interface ISaleRequest {
  client_id: number;
  user_id: number;
  cash_register_id: number;
  payment_method?: PaymentMethodName | string;
  client_tax_id?: string | null;
  business_name?: string | null;
  items: ISaleItemRequest[];
}
