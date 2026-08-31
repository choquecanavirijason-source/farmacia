import apiClient from "@/config/axios";
import type { ISale, IInvoice, ISaleRequest } from "@/lib/types/sale";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const fetchSales = async (
  params?: IPaginationRequest
): Promise<IPaginatedResponse<ISale>> => {
  const res = await apiClient.get<IPaginatedResponse<ISale>>("/sales", { params });
  return res.data;
};

export const createSale = async (data: any): Promise<ISale> => {
  const payload = {
    client_id: data.client_id ?? data.id_cliente,
    user_id: data.user_id ?? data.id_usuario,
    cash_register_id: data.cash_register_id ?? data.id_caja,
    payment_method: data.payment_method ?? data.forma_pago,
    client_tax_id: data.client_tax_id ?? data.nit_cliente,
    business_name: data.business_name ?? data.razon_social,
    items: (data.items || []).map((item: any) => ({
      medicament_id: item.medicament_id ?? item.id_medicamento,
      batch_id: item.batch_id ?? item.id_lote,
      quantity: item.quantity ?? item.cantidad,
      unit_price: item.unit_price ?? item.precio_unitario,
      discount_percent: item.discount_percent ?? item.descuento_pct ?? 0,
    })),
  };
  const res = await apiClient.post<IApiResponse<ISale>>("/sales", payload);
  return res.data.data;
};

export const voidSale = async (
  id: number,
  reason: string
): Promise<IApiResponse<void>> => {
  const res = await apiClient.post<IApiResponse<void>>(`/sales/${id}/void`, { motivo: reason });
  return res.data;
};

export const fetchInvoice = async (saleId: number): Promise<IInvoice> => {
  const res = await apiClient.get<{ data: IInvoice }>(`/sales/${saleId}/invoice`);
  return res.data.data;
};

export const fetchSaleDetails = async (saleId: number): Promise<any[]> => {
  const res = await apiClient.get<{ data: any[] }>(`/sales/${saleId}/details`);
  return res.data.data;
};

// Aliases de compatibilidad
export const fetchVentas = async (): Promise<any[]> => {
  const res = await apiClient.get<IPaginatedResponse<ISale>>("/sales?per_page=100");
  return res.data.data.map((s) => ({
    ...s,
    id_venta: s.id,
    fecha_hora: s.sale_date,
    total: Number(s.total),
    estado: s.status,
    id_cliente: s.client_id,
    id_usuario: s.user_id,
    id_caja: s.cash_register_id,
    forma_pago: s.payment_method || "Efectivo",
  }));
};
export const crearVenta = createSale;
export const anularVenta = (id: number, reason: string) => voidSale(id, reason);
export const fetchFacturaPorVenta = fetchInvoice;
export const fetchDetallesByVenta = fetchSaleDetails;
