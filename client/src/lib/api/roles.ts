import apiClient from "@/config/axios";
import type { IRole, IRoleRequest } from "@/lib/types/role";
import type { IPermissionsResponse } from "@/lib/types/permission";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

let rolesPromise: Promise<IRole[]> | null = null;

export const fetchRoles = async (forceRefresh = false): Promise<IRole[]> => {
  if (!forceRefresh && rolesPromise) {
    return rolesPromise;
  }

  rolesPromise = apiClient
    .get<IPaginatedResponse<IRole>>("/roles?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        rolesPromise = null;
      }, 1000);
    });

  return rolesPromise;
};

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<IRole>> => {
  const res = await apiClient.get<IPaginatedResponse<IRole>>("/roles", { params, signal });
  return res.data;
};

export const fetchRole = async (id: number): Promise<IRole> => {
  const res = await apiClient.get<IApiResponse<IRole>>(`/roles/${id}`);
  return res.data.data;
};

export const create = async (input: IRoleRequest): Promise<IApiResponse<IRole>> => {
  rolesPromise = null;
  const response = await apiClient.post<IApiResponse<IRole>>("/roles", input);
  return response.data;
};

export const update = async (
  id: number,
  input: Partial<IRoleRequest>
): Promise<IApiResponse<IRole>> => {
  rolesPromise = null;
  const response = await apiClient.put<IApiResponse<IRole>>(`/roles/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  rolesPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>(`/roles/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  rolesPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>("/roles", { data: { ids } });
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/roles/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};

export const fetchPermissions = async (): Promise<IPermissionsResponse> => {
  const res = await apiClient.get<{ success: boolean; data: IPermissionsResponse }>("/permissions");
  return res.data.data;
};
