import apiClient from "@/config/axios";
import type { IPurchase, IPurchaseDetail, IPurchaseRequest } from "@/lib/types/purchase";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const fetchPurchases = async (
  params?: IPaginationRequest
): Promise<IPaginatedResponse<IPurchase>> => {
  const res = await apiClient.get<IPaginatedResponse<IPurchase>>("/purchases", { params });
  return res.data;
};

export const createPurchase = async (data: any): Promise<IPurchase> => {
  const payload: IPurchaseRequest = {
    supplier_id: data.supplier_id ?? data.id_proveedor,
    invoice_number: data.invoice_number ?? data.numero_factura,
    purchase_date: data.purchase_date ?? data.fecha_compra,
    items: (data.items || []).map((item: any) => ({
      medicament_id: item.medicament_id ?? item.id_medicamento,
      quantity: item.quantity ?? item.cantidad,
      unit_price: item.unit_price ?? item.precio_unitario,
      batch_number: item.batch_number ?? item.numero_lote,
      expiration_date: item.expiration_date ?? item.fecha_vencimiento,
    })),
  };
  const res = await apiClient.post<IApiResponse<IPurchase>>("/purchases", payload);
  return res.data.data;
};

export const fetchPurchaseDetails = async (purchaseId: number): Promise<IPurchaseDetail[]> => {
  const res = await apiClient.get<{ data: IPurchaseDetail[] }>(`/purchases/${purchaseId}/details`);
  return res.data.data;
};

// Aliases de compatibilidad
export const fetchCompras = async (): Promise<any[]> => {
  const res = await apiClient.get<IPaginatedResponse<IPurchase>>("/purchases?per_page=100");
  return res.data.data.map((p) => ({
    ...p,
    id_compra: p.id,
    id_proveedor: p.supplier_id,
    numero_factura: p.invoice_number,
    fecha_compra: p.purchase_date,
    total: Number(p.total),
  }));
};
export const registrarCompra = createPurchase;
export const fetchDetalleCompra = fetchPurchaseDetails;
