import apiClient from "@/config/axios";
import type { IPresentation, IPresentationRequest } from "@/lib/types/presentation";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<IPresentation>> => {
  const res = await apiClient.get<IPaginatedResponse<IPresentation>>("/presentations", { params, signal });
  return res.data;
};

export const create = async (input: IPresentationRequest): Promise<IApiResponse<IPresentation>> => {
  const response = await apiClient.post<IApiResponse<IPresentation>>("/presentations", input);
  return response.data;
};

export const update = async (id: number, input: Partial<IPresentationRequest>): Promise<IApiResponse<IPresentation>> => {
  const response = await apiClient.put<IApiResponse<IPresentation>>(`/presentations/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/presentations/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/presentations", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IPresentation>> => {
  const response = await apiClient.post<IApiResponse<IPresentation>>(`/presentations/${id}/restore`);
  return response.data;
};

export const exportResource = async (format: "excel" | "pdf"): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/presentations/export", {
    params: { format },
    responseType: "blob",
  });
  return res.data;
};
