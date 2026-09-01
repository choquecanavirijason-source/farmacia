import apiClient from "@/config/axios";
import type { IMedicament, IMedicamentRequest } from "@/lib/types/medicament";
import type { IPaginatedResponse } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";
import type { ServerFetchParams } from "@/components/ui/table";
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

let medicamentsPromise: Promise<IMedicament[]> | null = null;

export const fetchMedicaments = async (forceRefresh = false): Promise<IMedicament[]> => {
  if (!forceRefresh && medicamentsPromise) return medicamentsPromise;

  medicamentsPromise = apiClient
    .get<IPaginatedResponse<IMedicament>>("/medicaments?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        medicamentsPromise = null;
      }, 1000);
    });

  return medicamentsPromise;
};

export const getPaginated = async (
  params: ServerFetchParams | any,
  signal?: AbortSignal,
  filters?: { category_id?: string; laboratory_id?: string; status?: string }
): Promise<IPaginatedResponse<IMedicament>> => {
  const query = {
    page: params.page,
    per_page: params.per_page ?? params.pageSize,
    search: params.search,
    sort_by: params.sort?.key ?? params.sort_by,
    sort_dir: params.sort?.direction ?? params.sort_dir,
    ...filters,
  };
  const res = await apiClient.get<IPaginatedResponse<IMedicament>>("/medicaments", { params: query, signal });
  return res.data;
};

export const create = async (input: IMedicamentRequest): Promise<IApiResponse<IMedicament>> => {
  medicamentsPromise = null;
  const response = await apiClient.post<IApiResponse<IMedicament>>("/medicaments", input);
  return response.data;
};

export const update = async (
  id: number,
  input: Partial<IMedicamentRequest>
): Promise<IApiResponse<IMedicament>> => {
  medicamentsPromise = null;
  const response = await apiClient.put<IApiResponse<IMedicament>>(`/medicaments/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  medicamentsPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>(`/medicaments/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  medicamentsPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>("/medicaments", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IMedicament>> => {
  medicamentsPromise = null;
  const response = await apiClient.post<IApiResponse<IMedicament>>(`/medicaments/${id}/restore`);
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/medicaments/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};

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
