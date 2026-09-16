import apiClient from "@/config/axios";
import type { ICategory, ICategoryRequest } from "@/lib/types/category";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal,
  filters?: { status?: string }
): Promise<IPaginatedResponse<ICategory>> => {
  const res = await apiClient.get<IPaginatedResponse<ICategory>>("/categories", {
    params: { ...params, ...filters },
    signal,
  });
  return res.data;
};

export const create = async (input: ICategoryRequest): Promise<IApiResponse<ICategory>> => {
  const response = await apiClient.post<IApiResponse<ICategory>>("/categories", input);
  return response.data;
};

export const update = async (id: number, input: Partial<ICategoryRequest>): Promise<IApiResponse<ICategory>> => {
  const response = await apiClient.put<IApiResponse<ICategory>>(`/categories/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/categories/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/categories", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<ICategory>> => {
  const response = await apiClient.post<IApiResponse<ICategory>>(`/categories/${id}/restore`);
  return response.data;
};

export const exportResource = async (format: "excel" | "pdf", filters: Record<string, any> = {}): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/categories/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};
