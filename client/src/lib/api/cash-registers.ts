import apiClient from "@/config/axios";
import type { ICashRegister, ICashMovement } from "@/lib/types/cash-register";
import type { IApiResponse } from "@/lib/types/api";
import type { ServerFetchParams } from "@/components/ui/table";
import type { IPaginatedResponse } from "@/lib/types/pagination";

export interface CierreResultado {
  caja: any;
  esperado: number;
  diferencia: number;
}

let cashRegistersPromise: Promise<ICashRegister[]> | null = null;
let currentCashRegisterPromise: Promise<ICashRegister | null> | null = null;

export const fetchCashRegisters = async (forceRefresh = false): Promise<ICashRegister[]> => {
  if (!forceRefresh && cashRegistersPromise) return cashRegistersPromise;

  cashRegistersPromise = apiClient
    .get<any>("/cash-registers?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        cashRegistersPromise = null;
      }, 1000);
    });

  return cashRegistersPromise;
};

export const getCashRegistersPaginated = async (
  params: ServerFetchParams,
  signal?: AbortSignal,
  filters?: { status?: string; branch_id?: string | number }
): Promise<IPaginatedResponse<ICashRegister>> => {
  const query: Record<string, any> = {
    page: params.page,
    per_page: params.per_page ?? params.pageSize,
    search: params.search || undefined,
    sort_by: params.sort?.key || undefined,
    sort_dir: params.sort?.direction || undefined,
    ...filters,
  };
  const res = await apiClient.get<IPaginatedResponse<ICashRegister>>("/cash-registers", {
    params: query,
    signal,
  });
  return res.data;
};

export const exportCashRegisters = async (
  format: "excel" | "pdf" | "csv" = "excel",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const exportFormat = format === "csv" ? "excel" : format;
  const res = await apiClient.get<Blob>("/cash-registers/export", {
    params: { format: exportFormat, ...filters },
    responseType: "blob",
  });
  return res.data;
};

export const exportResource = exportCashRegisters;

export const fetchCurrentCashRegister = async (forceRefresh = false): Promise<ICashRegister | null> => {
  if (!forceRefresh && currentCashRegisterPromise) return currentCashRegisterPromise;

  currentCashRegisterPromise = apiClient
    .get<{ data: ICashRegister | null }>("/cash-registers/current")
    .then((res) => res.data.data)
    .catch(() => null)
    .finally(() => {
      setTimeout(() => {
        currentCashRegisterPromise = null;
      }, 1000);
    });

  return currentCashRegisterPromise;
};

export const openCashRegister = async (data: { id_usuario?: number; monto_apertura: number }): Promise<ICashRegister> => {
  currentCashRegisterPromise = null;
  cashRegistersPromise = null;
  const res = await apiClient.post<IApiResponse<ICashRegister>>("/cash-registers/open", {
    opening_amount: data.monto_apertura,
  });
  return res.data.data;
};

export const closeCashRegister = async (id: number, data: { monto_cierre: number }): Promise<ICashRegister> => {
  currentCashRegisterPromise = null;
  cashRegistersPromise = null;
  const res = await apiClient.post<IApiResponse<ICashRegister>>(`/cash-registers/${id}/close`, {
    closing_amount: data.monto_cierre,
  });
  return res.data.data;
};

export const createCashMovement = async (
  cashRegisterId: number,
  data: { tipo: "ingreso" | "egreso" | "in" | "out"; monto: number; motivo: string }
): Promise<ICashMovement> => {
  currentCashRegisterPromise = null;
  const res = await apiClient.post<IApiResponse<ICashMovement>>(`/cash-registers/${cashRegisterId}/movements`, {
    type: data.tipo === "ingreso" || data.tipo === "in" ? "income" : "expense",
    amount: data.monto,
    description: data.motivo,
  });
  return res.data.data;
};

export const fetchCashMovements = async (cashRegisterId: number): Promise<ICashMovement[]> => {
  const res = await apiClient.get<{ data: ICashMovement[] }>(`/cash-registers/${cashRegisterId}/movements`);
  return res.data.data;
};

export function montoEsperado(caja: any, movimientos: any[] = []): number {
  const apertura = Number(caja?.monto_apertura ?? caja?.opening_amount ?? 0);
  const movTotal = (movimientos || []).reduce((acc, m) => {
    const isIngreso = m.tipo === "ingreso" || m.type === "income" || m.type === "in";
    const monto = Number(m.monto ?? m.amount ?? 0);
    return isIngreso ? acc + monto : acc - monto;
  }, 0);
  return apertura + movTotal;
}

export const fetchCajas = async (): Promise<any[]> => {
  const list = await fetchCashRegisters();
  return list.map((c) => ({
    id_caja: c.id,
    fecha_apertura: c.opening_date,
    monto_apertura: Number(c.opening_amount),
    fecha_cierre: c.closing_date,
    monto_cierre: c.closing_amount ? Number(c.closing_amount) : null,
    monto_esperado: c.expected_closing_amount ? Number(c.expected_closing_amount) : null,
    monto_esperado_cierre: c.expected_closing_amount ? Number(c.expected_closing_amount) : null,
    estado: c.status === "open" ? "abierta" : "cerrada",
    id_usuario: c.user_id ?? 1,
    ...c,
  }));
};

export const fetchCajaAbierta = async (forceRefresh = false): Promise<any | null> => {
  const c = await fetchCurrentCashRegister(forceRefresh);
  if (!c) return null;
  return {
    id_caja: c.id,
    fecha_apertura: c.opening_date || (c as any).opened_at,
    monto_apertura: Number(c.opening_amount),
    fecha_cierre: c.closing_date || (c as any).closed_at,
    monto_cierre: c.closing_amount ? Number(c.closing_amount) : null,
    monto_esperado: c.expected_closing_amount ? Number(c.expected_closing_amount) : null,
    estado: "abierta",
    id_usuario: c.user_id ?? 1,
    movements: (c as any).movements || [],
    ...c,
  };
};

export const abrirCaja = openCashRegister;
export const cerrarCaja = closeCashRegister;
export const registrarMovimiento = createCashMovement;
export const fetchMovimientos = async (id: number): Promise<any[]> => {
  const list = await fetchCashMovements(id);
  return list.map((m) => ({
    id_movimiento: m.id,
    id_caja: m.cash_register_id,
    tipo: (m.type === "ingreso" || m.type === "in" || (m as any).type === "income") ? "ingreso" : "egreso",
    concepto: m.concept || (m as any).description || "",
    monto: Number(m.amount),
    fecha: m.movement_date || m.created_at,
    ...m,
  }));
};
export const fetchMovimientosByCaja = fetchMovimientos;
