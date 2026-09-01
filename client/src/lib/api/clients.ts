import apiClient from "@/config/axios";
import type { IClient, IClientRequest } from "@/lib/types/client";
import type { IPaginatedResponse } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import type { Cliente } from "@/lib/types";
import type { ServerFetchParams } from "@/components/ui/table";

let clientsPromise: Promise<Cliente[]> | null = null;

export const fetchClients = async (forceRefresh = false): Promise<Cliente[]> => {
  if (!forceRefresh && clientsPromise) return clientsPromise;

  clientsPromise = apiClient
    .get<IPaginatedResponse<IClient>>("/clients?per_page=100")
    .then((res) =>
      res.data.data.map((c) => ({
        ...c,
        id_cliente: c.id,
        nombre: `${c.firstname} ${c.lastname}`.trim(),
        ci: c.ci ?? "",
        nit: c.nit ?? "",
        telefono: c.phone ?? "",
        direccion: c.address ?? "",
      }))
    )
    .finally(() => {
      setTimeout(() => {
        clientsPromise = null;
      }, 1000);
    });

  return clientsPromise;
};

export const fetchClientes = fetchClients;

export const getPaginated = async (
  params: ServerFetchParams | any,
  signal?: AbortSignal,
  filters?: { status?: string }
): Promise<IPaginatedResponse<IClient>> => {
  const query = {
    page: params.page,
    per_page: params.per_page ?? params.pageSize,
    search: params.search,
    sort_by: params.sort?.key ?? params.sort_by,
    sort_dir: params.sort?.direction ?? params.sort_dir,
    ...filters,
  };
  const res = await apiClient.get<IPaginatedResponse<IClient>>(`/clients`, { params: query, signal });
  return res.data;
};

export const create = async (input: IClientRequest): Promise<IApiResponse<IClient>> => {
  clientsPromise = null;
  const response = await apiClient.post<IApiResponse<IClient>>("/clients", input);
  return response.data;
};

export const update = async (id: number, input: Partial<IClientRequest>): Promise<IApiResponse<IClient>> => {
  clientsPromise = null;
  const response = await apiClient.put<IApiResponse<IClient>>(`/clients/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  clientsPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>(`/clients/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  clientsPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>("/clients", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IClient>> => {
  clientsPromise = null;
  const response = await apiClient.post<IApiResponse<IClient>>(`/clients/${id}/restore`);
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/clients/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};