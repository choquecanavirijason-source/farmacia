import apiClient from "@/config/axios";
import type { ISupplier, ISupplierRequest } from "@/lib/types/supplier";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const fetchSuppliers = async (): Promise<ISupplier[]> => {
  const res = await apiClient.get<IPaginatedResponse<ISupplier>>("/suppliers?per_page=100");
  return res.data.data;
};

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<ISupplier>> => {
  const res = await apiClient.get<IPaginatedResponse<ISupplier>>("/suppliers", { params, signal });
  return res.data;
};

export const create = async (input: ISupplierRequest): Promise<IApiResponse<ISupplier>> => {
  const response = await apiClient.post<IApiResponse<ISupplier>>("/suppliers", input);
  return response.data;
};

export const update = async (id: number, input: Partial<ISupplierRequest>): Promise<IApiResponse<ISupplier>> => {
  const response = await apiClient.put<IApiResponse<ISupplier>>(`/suppliers/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/suppliers/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/suppliers", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<ISupplier>> => {
  const response = await apiClient.post<IApiResponse<ISupplier>>(`/suppliers/${id}/restore`);
  return response.data;
};

export const exportResource = async (format: "excel" | "pdf"): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/suppliers/export", {
    params: { format },
    responseType: "blob",
  });
  return res.data;
};

// Aliases de compatibilidad
export const fetchProveedores = async (): Promise<any[]> => {
  const list = await fetchSuppliers();
  return list.map((s) => ({
    ...s,
    id_proveedor: s.id,
    nombre: s.name,
    nit: s.nit ?? "",
    telefono: s.phone ?? "",
    direccion: s.address ?? "",
    email: s.email ?? "",
  }));
};
