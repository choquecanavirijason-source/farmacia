import apiClient from "@/config/axios";
import type { IBatch, IBatchRequest } from "@/lib/types/batch";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import type { IKardexMovement, AdjustmentReason, Lote, Medicamento } from "@/lib/types";

export const DIAS_ALERTA_VENCIMIENTO = 90;

let batchesPromise: Promise<IBatch[]> | null = null;

export const fetchBatches = async (
  forceRefresh = false,
  branchId?: string | number | null
): Promise<IBatch[]> => {
  // El filtro explícito de sucursal (usado por la vista "todas las sucursales") no se
  // cachea con el resto de llamadas por defecto (POS, alertas de la sucursal activa, etc.).
  if (branchId !== undefined) {
    const res = await apiClient.get<IPaginatedResponse<IBatch>>("/batches", {
      params: { per_page: 100, branch_id: branchId ?? "all" },
    });
    return res.data.data;
  }

  if (!forceRefresh && batchesPromise) return batchesPromise;

  batchesPromise = apiClient
    .get<IPaginatedResponse<IBatch>>("/batches?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        batchesPromise = null;
      }, 1000);
    });

  return batchesPromise;
};

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal,
  filters?: { branch_id?: string | number; status?: string }
): Promise<IPaginatedResponse<IBatch>> => {
  const res = await apiClient.get<IPaginatedResponse<IBatch>>("/batches", {
    params: { ...params, ...filters },
    signal,
  });
  return res.data;
};

export const create = async (input: IBatchRequest): Promise<IApiResponse<IBatch>> => {
  batchesPromise = null;
  const response = await apiClient.post<IApiResponse<IBatch>>("/batches", input);
  return response.data;
};

export const update = async (
  id: number,
  input: Partial<IBatchRequest>
): Promise<IApiResponse<IBatch>> => {
  batchesPromise = null;
  const response = await apiClient.put<IApiResponse<IBatch>>(`/batches/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  batchesPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>(`/batches/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  batchesPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>("/batches", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IBatch>> => {
  batchesPromise = null;
  const response = await apiClient.post<IApiResponse<IBatch>>(`/batches/${id}/restore`);
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/batches/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};

export const disposeBatch = async (
  id: number,
  input: { cantidad: number; motivo: AdjustmentReason; notas?: string }
): Promise<IApiResponse<void>> => {
  batchesPromise = null;
  const response = await apiClient.post<IApiResponse<void>>(`/batches/${id}/dispose`, input);
  return response.data;
};

export const restoreStock = async (
  id: number,
  cantidad: number
): Promise<IApiResponse<void>> => {
  batchesPromise = null;
  const response = await apiClient.post<IApiResponse<void>>(`/batches/${id}/restore`, { cantidad });
  return response.data;
};

export const fetchKardex = async (medicamentId: number, signal?: AbortSignal): Promise<any[]> => {
  const res = await apiClient.get<{ data: any[] }>(`/medicaments/${medicamentId}/kardex`, { signal });
  return res.data.data;
};

export function diasHasta(fechaIso: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaIso);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeProximosAVencer(
  lotes: any[],
  diasVentana = DIAS_ALERTA_VENCIMIENTO
): any[] {
  return lotes
    .filter(
      (l) =>
        (Number(l.cantidad_actual ?? l.current_quantity) > 0) &&
        diasHasta(l.fecha_vencimiento || l.expiration_date) <= diasVentana
    )
    .sort(
      (a, b) =>
        diasHasta(a.fecha_vencimiento || a.expiration_date) -
        diasHasta(b.fecha_vencimiento || b.expiration_date)
    );
}

export interface StockBajoItem {
  medicamento: any;
  stock: number;
}

export function computeStockBajo(
  medicamentos: any[],
  lotes: any[]
): StockBajoItem[] {
  const porMedicamento = new Map<number, number>();
  const medicamentosConLotes = new Set<number>();
  for (const l of lotes) {
    const mId = l.id_medicamento || l.medicament_id;
    medicamentosConLotes.add(mId);
    porMedicamento.set(
      mId,
      (porMedicamento.get(mId) ?? 0) + Number(l.cantidad_actual ?? l.current_quantity ?? 0)
    );
  }
  // Solo cuenta medicamentos que ya tienen al menos un lote registrado en esta sucursal
  // (activo o agotado). Un medicamento que nunca se cargó aquí no es "stock bajo": simplemente
  // no se ha traspasado/comprado todavía para esta sucursal.
  return medicamentos
    .filter((m) => medicamentosConLotes.has(m.id_medicamento || m.id))
    .filter((m) => (porMedicamento.get(m.id_medicamento || m.id) ?? 0) < Number(m.stock_minimo || m.min_stock || 0))
    .map((m) => ({
      medicamento: m,
      stock: porMedicamento.get(m.id_medicamento || m.id) ?? 0,
    }));
}

export interface KardexMovimientoConLote extends IKardexMovement {
  numero_lote: string;
}

export const fetchLotes = async () => {
  const list = await fetchBatches();
  return list.map((l) => ({
    id_lote: l.id,
    id_medicamento: l.medicament_id,
    numero_lote: l.batch_number,
    fecha_vencimiento: l.expiration_date,
    cantidad_actual: Number(l.current_quantity),
    precio_compra: Number(l.purchase_price),
    ...l,
  }));
};
export const darDeBajaLote = disposeBatch;
export const reincorporarStock = restoreStock;
export const fetchKardexPorMedicamento = fetchKardex;
export const fetchKardexByLote = async (id: number) => {
  const res = await apiClient.get<{ data: any[] }>(`/batches/${id}/kardex`);
  const data = Array.isArray(res.data) ? res.data : res.data.data;
  return (data || []).map((k) => ({
    id_movimiento: k.id,
    id_lote: k.batch_id,
    tipo: k.type,
    cantidad: k.quantity,
    saldo: k.balance,
    motivo: k.reason,
    fecha_hora: k.occurred_at || k.created_at,
    ...k,
  }));
};

export const fetchKardexByMedicamento = async (id: number, signal?: AbortSignal) => {
  const data = await fetchKardex(id, signal);
  return data.map((k) => ({
    id_movimiento: k.id,
    id_lote: k.batch_id,
    tipo: k.type,
    cantidad: k.quantity,
    saldo: k.balance,
    motivo: k.reason,
    fecha_hora: k.occurred_at || k.created_at,
    numero_lote: k.batch_number || "",
    ...k,
  }));
};
