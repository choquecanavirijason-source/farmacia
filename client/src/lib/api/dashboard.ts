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
  } | null;
  ultimas_ventas: {
    id: number;
    fecha_hora: string;
    total: number;
    cliente: string;
    estado: string;
  }[];
  top_productos: {
    id: number;
    name: string;
    code?: string;
    total_vendido: number;
    total_recaudado: number;
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
  ventas_por_rango?: {
    date: string;
    label: string;
    value: number;
  }[];
  ventas_rango_total?: number;
  rango_inicio?: string;
  rango_fin?: string;
}

export interface DashboardFilterParams {
  start_date?: string;
  end_date?: string;
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
