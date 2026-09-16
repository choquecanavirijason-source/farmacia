export interface IProductCategory {
  id: number;
  name: string;
}

export interface IProduct {
  id: number;
  code: string;
  name: string;
  concentration: string | null;
  price: string;
  requires_prescription: boolean;
  image_url: string | null;
  total_stock: number;
  in_stock: boolean;
  category: IProductCategory | null;
  presentation: IProductCategory | null;
  laboratory: IProductCategory | null;
}

export interface ICartItem {
  medicament_id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  max_stock: number;
}

export type OrderStatus = "pending" | "confirmed" | "ready" | "completed" | "cancelled";

export interface IOrderDetail {
  id: number;
  medicament_id: number;
  name: string;
  image_url?: string | null;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

export interface IOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  total: string | number;
  contact_name: string;
  contact_phone: string;
  notes: string | null;
  branch?: IProductCategory | null;
  created_at: string;
  details: IOrderDetail[];
}

export interface ICreateOrderPayload {
  contact_name: string;
  contact_phone: string;
  notes?: string;
  items: Array<{ medicament_id: number; quantity: number }>;
}
