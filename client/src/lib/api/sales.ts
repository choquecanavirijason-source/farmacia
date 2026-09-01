import apiClient from "@/config/axios";
import type { ISale, IInvoice } from "@/lib/types/sale";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import type { ServerFetchParams } from "@/components/ui/table";

export const fetchSales = async (
  params?: IPaginationRequest
): Promise<IPaginatedResponse<ISale>> => {
  const res = await apiClient.get<IPaginatedResponse<ISale>>("/sales", { params });
  return res.data;
};

export const getSalesPaginated = async (
  params: ServerFetchParams,
  signal?: AbortSignal,
  filters?: { status?: string; start_date?: string; end_date?: string; client_id?: string }
): Promise<IPaginatedResponse<ISale>> => {
  const query: Record<string, any> = {
    page: params.page,
    per_page: params.per_page ?? params.pageSize,
    search: params.search || undefined,
    sort_by: params.sort?.key || undefined,
    sort_dir: params.sort?.direction || undefined,
    ...filters,
  };
  const res = await apiClient.get<IPaginatedResponse<ISale>>("/sales", {
    params: query,
    signal,
  });
  return res.data;
};

export const exportSales = async (
  format: "excel" | "pdf" | "csv" = "excel",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const exportFormat = format === "csv" ? "excel" : format;
  const res = await apiClient.get<Blob>("/sales/export", {
    params: { format: exportFormat, ...filters },
    responseType: "blob",
  });
  return res.data;
};

export const exportResource = exportSales;

export const createSale = async (data: any): Promise<ISale> => {
  const paymentMethod = data.forma_pago || data.payment_method || "Efectivo";
  const payload = {
    client_id: data.client_id ?? data.id_cliente,
    user_id: data.user_id ?? data.id_usuario,
    cash_register_id: data.cash_register_id ?? data.id_caja,
    forma_pago: paymentMethod,
    payment_method: paymentMethod,
    nit_cliente: data.nit_cliente ?? data.client_tax_id,
    client_tax_id: data.client_tax_id ?? data.nit_cliente,
    razon_social: data.razon_social ?? data.business_name,
    business_name: data.business_name ?? data.razon_social,
    items: (data.items || []).map((item: any) => ({
      medicament_id: item.medicament_id ?? item.id_medicamento,
      batch_id: item.batch_id ?? item.id_lote,
      quantity: item.quantity ?? item.cantidad,
      unit_price: item.unit_price ?? item.precio_unitario,
      discount_percent: item.discount_percent ?? item.descuento_pct ?? item.descuentoPct ?? 0,
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

export const fetchSale = async (id: number): Promise<ISale> => {
  const res = await apiClient.get<IApiResponse<ISale>>(`/sales/${id}`);
  return res.data.data;
};

export const fetchSaleDetails = async (saleId: number): Promise<any[]> => {
  const res = await apiClient.get<{ data: any[] }>(`/sales/${saleId}/details`);
  return res.data.data;
};

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
