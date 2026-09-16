import type { OrderStatus } from "@/lib/types/marketplace";

export interface IStaffOrderDetail {
  id: number;
  medicament_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface IStaffOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  total: number;
  contact_name: string;
  contact_phone: string;
  notes: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  customer: { id: number; name: string; email: string } | null;
  branch: { id: number; name: string } | null;
  details: IStaffOrderDetail[];
}

export interface IBranchAvailabilityMissingItem {
  medicament_id: number;
  name: string;
  available: number;
  needed: number;
}

export interface IBranchAvailability {
  id: number;
  name: string;
  can_fulfill: boolean;
  missing: IBranchAvailabilityMissingItem[];
}

export type { OrderStatus };
