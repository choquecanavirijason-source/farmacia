import type { ISupplier } from "./supplier";
import type { IMedicament } from "./medicament";

export interface IPurchaseDetail {
  id: number;
  purchase_id: number;
  medicament_id: number;
  batch_id?: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  medicament?: IMedicament;
}

export interface IPurchase {
  id: number;
  invoice_number: string;
  purchase_date: string;
  total: number;
  supplier_id: number;
  supplier?: ISupplier;
  details?: IPurchaseDetail[];
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

export interface IPurchaseItemRequest {
  medicament_id: number;
  quantity: number;
  unit_price: number;
  batch_number: string;
  expiration_date: string;
}

export interface IPurchaseRequest {
  supplier_id: number;
  invoice_number: string;
  purchase_date: string;
  items: IPurchaseItemRequest[];
}
