import apiClient from "@/config/axios";
import type { IUser, IUserRequest } from "@/lib/types/user";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const fetchUsers = async (): Promise<IUser[]> => {
  const res = await apiClient.get<IPaginatedResponse<IUser>>("/users?per_page=100");
  return res.data.data;
};

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<IUser>> => {
  const res = await apiClient.get<IPaginatedResponse<IUser>>("/users", { params, signal });
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

export const exportResource = async (format: "excel" | "pdf"): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/users/export", {
    params: { format },
    responseType: "blob",
  });
  return res.data;
};

// Aliases de compatibilidad
export const fetchUsuarios = fetchUsers;
