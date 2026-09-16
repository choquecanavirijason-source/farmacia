import apiClient from "@/config/axios";

export interface IDashboardStats {
  ventas_hoy: {
    total: number;
    cantidad: number;
  };
  ventas_mes: {
    total: number;
  };
  stock_bajo_count: number;
  lotes_por_vencer_count: number;
  total_clientes: number;
  total_medicamentos: number;
  caja_abierta: {
    id: number;
    opened_at: string;
    opening_amount: number;
    status: string;
    branch?: { id: number; name: string } | null;
  } | null;
  cajas_abiertas?: {
    id: number;
    opened_at: string;
    opening_amount: number;
    branch?: { id: number; name: string } | null;
  }[];
  ultimas_ventas: {
    id: number;
    fecha_hora: string;
    total: number;
    cliente: string;
    estado: string;
  }[];
  ventas_ultimos_7_dias?: {
    date: string;
    label: string;
    value: number;
  }[];
  ventas_ultimos_30_dias?: {
    date: string;
    label: string;
    value: number;
  }[];
  ventas_mes_anterior?: number;
  variacion_mensual_pct?: number | null;
  ticket_promedio_hoy?: number;
  total_medicamentos_stock_saludable?: number;

  compras_por_proveedor?: { id: number; name: string; total: number }[];
  lotes_semaforo?: { label: string; value: number }[];
  compras_vs_ventas?: { label: string; ventas: number; compras: number }[];
  productos_baja_rotacion?: {
    id: number;
    name: string;
    code?: string;
    vendido_90_dias: number;
  }[];
  ventas_por_dia_semana?: { label: string; value: number }[];
  ventas_por_hora_dia?: { day: string; horas: number[] }[];
}

export interface DashboardFilterParams {
  start_date?: string;
  end_date?: string;
  branch_id?: number;
}

export const fetchDashboardStats = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<IDashboardStats> => {
  const res = await apiClient.get<{ success: boolean; data: IDashboardStats }>("/dashboard/stats", {
    params: filters,
    signal,
  });
  return res.data.data;
};

export interface ISalesSummary {
  ventas_por_rango: { date: string; label: string; value: number }[];
  ventas_rango_total: number;
  rango_inicio: string;
  rango_fin: string;
  top_productos: {
    id: number;
    name: string;
    code?: string;
    total_vendido: number;
    total_recaudado: number;
  }[];
}

/** Versión liviana de fetchDashboardStats — solo tendencia de ventas + top productos,
 * sin las demás métricas del panel principal. Úsala en vistas que no necesiten el resto. */
export const fetchSalesSummary = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<ISalesSummary> => {
  const res = await apiClient.get<{ success: boolean; data: ISalesSummary }>("/dashboard/sales-summary", {
    params: filters,
    signal,
  });
  return res.data.data;
};

// ── Métricas del Panel Principal con filtro de fecha propio (cada gráfico pide su propio
// rango, en vez de compartir un único filtro global para toda la vista) ──────────────────

export interface IVentasTendencia {
  data: { date: string; label: string; value: number }[];
  total: number;
  rango_inicio: string;
  rango_fin: string;
}

export const fetchVentasTendencia = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<IVentasTendencia> => {
  const res = await apiClient.get<{ success: boolean; data: IVentasTendencia }>("/dashboard/ventas-tendencia", {
    params: filters,
    signal,
  });
  return res.data.data;
};

export interface IRankingVendedores {
  data: { id: number; name: string; total_vendido: number; cantidad_ventas: number }[];
}

export const fetchRankingVendedores = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<IRankingVendedores> => {
  const res = await apiClient.get<{ success: boolean; data: IRankingVendedores }>("/dashboard/ranking-vendedores", {
    params: filters,
    signal,
  });
  return res.data.data;
};

export interface ITopProductosReport {
  data: { id: number; name: string; code?: string; total_vendido: number; total_recaudado: number }[];
}

export const fetchDashboardTopProductos = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<ITopProductosReport> => {
  const res = await apiClient.get<{ success: boolean; data: ITopProductosReport }>("/dashboard/top-productos", {
    params: filters,
    signal,
  });
  return res.data.data;
};

export interface IVentasPorCategoria {
  data: { id: number; name: string; total: number }[];
}

export const fetchVentasPorCategoria = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<IVentasPorCategoria> => {
  const res = await apiClient.get<{ success: boolean; data: IVentasPorCategoria }>("/dashboard/ventas-por-categoria", {
    params: filters,
    signal,
  });
  return res.data.data;
};

export interface IVentasPorMetodoPago {
  data: { id: number; name: string; total: number }[];
}

export const fetchVentasPorMetodoPago = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<IVentasPorMetodoPago> => {
  const res = await apiClient.get<{ success: boolean; data: IVentasPorMetodoPago }>("/dashboard/ventas-por-metodo-pago", {
    params: filters,
    signal,
  });
  return res.data.data;
};

export interface IMargenBruto {
  data: { date: string; label: string; ingreso: number; costo: number; margen: number }[];
}

export const fetchMargenBruto = async (
  filters?: DashboardFilterParams,
  signal?: AbortSignal
): Promise<IMargenBruto> => {
  const res = await apiClient.get<{ success: boolean; data: IMargenBruto }>("/dashboard/margen-bruto", {
    params: filters,
    signal,
  });
  return res.data.data;
};
