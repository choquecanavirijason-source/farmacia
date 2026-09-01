import apiClient from "@/config/axios";
import type { IUser, IUserRequest } from "@/lib/types/user";
import type { IPaginatedResponse } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import type { ServerFetchParams } from "@/components/ui/table";

export const fetchUsers = async (): Promise<IUser[]> => {
  const res = await apiClient.get<IPaginatedResponse<IUser>>("/users?per_page=100");
  return res.data.data;
};

export const getPaginated = async (
  params: ServerFetchParams | any,
  signal?: AbortSignal,
  filters?: { status?: string; role?: string; state?: string }
): Promise<IPaginatedResponse<IUser>> => {
  const query = {
    page: params.page,
    per_page: params.per_page ?? params.pageSize,
    search: params.search,
    sort_by: params.sort?.key ?? params.sort_by,
    sort_dir: params.sort?.direction ?? params.sort_dir,
    ...filters,
  };
  const res = await apiClient.get<IPaginatedResponse<IUser>>("/users", { params: query, signal });
  return res.data;
};

export const create = async (input: IUserRequest): Promise<IApiResponse<IUser>> => {
  const response = await apiClient.post<IApiResponse<IUser>>("/users", input);
  return response.data;
};

export const update = async (id: number, input: Partial<IUserRequest>): Promise<IApiResponse<IUser>> => {
  const response = await apiClient.put<IApiResponse<IUser>>(`/users/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/users/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/users", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IUser>> => {
  const response = await apiClient.post<IApiResponse<IUser>>(`/users/${id}/restore`);
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/users/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};

export const fetchUsuarios = fetchUsers;
