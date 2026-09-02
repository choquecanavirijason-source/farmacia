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
  ventas_mes_anterior?: number;
  variacion_mensual_pct?: number | null;
  ticket_promedio_hoy?: number;
  total_medicamentos_stock_saludable?: number;

  ventas_por_metodo_pago?: { id: number; name: string; total: number }[];
  ventas_por_categoria?: { id: number; name: string; total: number }[];
  margen_por_rango?: {
    date: string;
    label: string;
    ingreso: number;
    costo: number;
    margen: number;
  }[];
  compras_por_proveedor?: { id: number; name: string; total: number }[];
  ranking_vendedores?: {
    id: number;
    name: string;
    total_vendido: number;
    cantidad_ventas: number;
  }[];
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
