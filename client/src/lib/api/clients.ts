import apiClient from "@/config/axios";
import type { IClient, IClientRequest } from "@/lib/types/client";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import type { Cliente } from "@/lib/types";

export const fetchClients = async (): Promise<Cliente[]> => {
  const res = await apiClient.get<IPaginatedResponse<IClient>>("/clients?per_page=100");
  return res.data.data.map((c) => ({
    ...c,
    id_cliente: c.id,
    nombre: `${c.firstname} ${c.lastname}`.trim(),
    ci: c.ci ?? "",
    nit: c.nit ?? "",
    telefono: c.phone ?? "",
    direccion: c.address ?? "",
  }));
};

export const fetchClientes = fetchClients;

export const getPaginated = async (params: IPaginationRequest, signal?: AbortSignal): Promise<IPaginatedResponse<IClient>> => {
  const res = await apiClient.get<IPaginatedResponse<IClient>>(`/clients`, { params, signal });
  return res.data;
};

export const create = async (input: IClientRequest): Promise<IApiResponse<IClient>> => {
  const response = await apiClient.post<IApiResponse<IClient>>("/clients", input);
  return response.data;
};

export const update = async (id: number, input: Partial<IClientRequest>): Promise<IApiResponse<IClient>> => {
  const response = await apiClient.put<IApiResponse<IClient>>(`/clients/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/clients/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/clients", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IClient>> => {
  const response = await apiClient.post<IApiResponse<IClient>>(`/clients/${id}/restore`);
  return response.data;
};

export const exportResource = async (format: "excel" | "pdf"): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/clients/export", {
    params: { format },
    responseType: "blob",
  });
  return res.data;
};