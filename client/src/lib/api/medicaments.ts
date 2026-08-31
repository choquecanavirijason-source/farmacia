import apiClient from "@/config/axios";
import type { IMedicament, IMedicamentRequest } from "@/lib/types/medicament";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import {
  fetchCategories,
  fetchLaboratories,
  fetchPresentations,
  fetchCategorias,
  fetchLaboratorios,
  fetchPresentaciones,
} from "./catalogs";

export {
  fetchCategories,
  fetchLaboratories,
  fetchPresentations,
  fetchCategorias,
  fetchLaboratorios,
  fetchPresentaciones,
};

export const fetchMedicaments = async (): Promise<IMedicament[]> => {
  const res = await apiClient.get<IPaginatedResponse<IMedicament>>("/medicaments?per_page=100");
  return res.data.data;
};

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<IMedicament>> => {
  const res = await apiClient.get<IPaginatedResponse<IMedicament>>("/medicaments", { params, signal });
  return res.data;
};

export const create = async (input: IMedicamentRequest): Promise<IApiResponse<IMedicament>> => {
  const response = await apiClient.post<IApiResponse<IMedicament>>("/medicaments", input);
  return response.data;
};

export const update = async (
  id: number,
  input: Partial<IMedicamentRequest>
): Promise<IApiResponse<IMedicament>> => {
  const response = await apiClient.put<IApiResponse<IMedicament>>(`/medicaments/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>(`/medicaments/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  const response = await apiClient.delete<IApiResponse<void>>("/medicaments", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IMedicament>> => {
  const response = await apiClient.post<IApiResponse<IMedicament>>(`/medicaments/${id}/restore`);
  return response.data;
};

export const exportResource = async (format: "excel" | "pdf"): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/medicaments/export", {
    params: { format },
    responseType: "blob",
  });
  return res.data;
};

// Aliases de compatibilidad
export const deleteMedicamento = remove;
export const fetchMedicamentos = async () => {
  const list = await fetchMedicaments();
  return list.map((m) => ({
    ...m,
    id_medicamento: m.id,
    codigo: m.code,
    nombre: m.name,
    concentracion: m.concentration ?? "",
    precio_venta: Number(m.price),
    stock_minimo: m.min_stock,
    requiere_receta: m.requires_prescription,
    estado: (m.status === "active" ? "activo" : "inactivo") as "activo" | "inactivo",
    id_categoria: m.category_id,
    id_presentacion: m.presentation_id,
    id_laboratorio: m.laboratory_id,
  }));
};
