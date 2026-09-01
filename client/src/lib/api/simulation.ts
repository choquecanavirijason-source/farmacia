import apiClient from "@/config/axios";

export interface SimulationParams {
  start_date: string;
  end_date: string;
  sellers_count?: number;
  supervisors_count?: number;
  admins_count?: number;
  min_daily_sales?: number;
  max_daily_sales?: number;
  reset_data?: boolean;
}

export interface GeneratedUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  password: string;
  is_primary: boolean;
}

export interface SimulationTimings {
  roles_permissions?: string;
  cleanup_reset?: string;
  user_generation?: string;
  batches_init?: string;
  simulation_processing?: string;
  bulk_db_inserts?: string;
  total_execution_time?: string;
}

export interface SimulationSummary {
  total_sales: number;
  total_purchases: number;
  total_revenue: number;
  sellers_count: number;
  supervisors_count: number;
  admins_count: number;
  start_date: string;
  end_date: string;
  timings?: SimulationTimings;
}

export interface SimulationRecord {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  summary: SimulationSummary | null;
  generated_users: GeneratedUser[];
  timings?: SimulationTimings;
  params: SimulationParams | null;
  created_at: string;
}

export interface SimulationRunResponse {
  id: number;
  summary: SimulationSummary;
  generated_users: GeneratedUser[];
  timings?: SimulationTimings;
  created_at: string;
}

export const fetchLatestSimulation = async (): Promise<SimulationRecord | null> => {
  const res = await apiClient.get<{ success: boolean; data: SimulationRecord | null }>(
    "/simulation/latest"
  );
  return res.data.data;
};

export const runSimulation = async (params: SimulationParams): Promise<SimulationRunResponse> => {
  const res = await apiClient.post<{ success: boolean; data: SimulationRunResponse; message: string }>(
    "/simulation/run",
    params,
    {
      timeout: 180000,
    }
  );
  return res.data.data;
};
