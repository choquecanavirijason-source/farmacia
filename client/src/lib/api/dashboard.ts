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
    total_vendido: number;
    total_recaudado: number;
  }[];
}

export const fetchDashboardStats = async (): Promise<IDashboardStats> => {
  const res = await apiClient.get<{ success: boolean; data: IDashboardStats }>("/dashboard/stats");
  return res.data.data;
};
