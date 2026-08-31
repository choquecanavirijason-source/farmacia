import apiClient from "@/config/axios";
import type { ILaboratory, ILaboratoryRequest } from "@/lib/types/laboratory";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<ILaboratory>> => {
  const res = await apiClient.get<IPaginatedResponse<ILaboratory>>("/laboratories", { params, signal });
  return res.data;
};

export const create = async (input: ILaboratoryRequest): Promise<IApiResponse<ILaboratory>> => {
  const response = await apiClient.post<IApiResponse<ILaboratory>>("/laboratories", input);
  return response.data;
};

export const update = async (id: number, input: Partial<ILaboratoryRequest>): Promise<IApiResponse<ILaboratory>> => {
  const response = await apiClient.put<IApiResponse<ILaboratory>>(`/laboratories/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/laboratories/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/laboratories", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<ILaboratory>> => {
  const response = await apiClient.post<IApiResponse<ILaboratory>>(`/laboratories/${id}/restore`);
  return response.data;
};

export const exportResource = async (format: "excel" | "pdf"): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/laboratories/export", {
    params: { format },
    responseType: "blob",
  });
  return res.data;
};
