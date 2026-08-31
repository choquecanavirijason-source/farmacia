import apiClient from "@/config/axios";
import type { ICategory } from "@/lib/types/category";
import type { IPresentation } from "@/lib/types/presentation";
import type { ILaboratory } from "@/lib/types/laboratory";
import type { IPaginatedResponse } from "@/lib/types/pagination";

export const fetchCategories = async (): Promise<ICategory[]> => {
  const res = await apiClient.get<IPaginatedResponse<ICategory>>("/categories?per_page=100");
  return res.data.data;
};

export const fetchPresentations = async (): Promise<IPresentation[]> => {
  const res = await apiClient.get<IPaginatedResponse<IPresentation>>("/presentations?per_page=100");
  return res.data.data;
};

export const fetchLaboratories = async (): Promise<ILaboratory[]> => {
  const res = await apiClient.get<IPaginatedResponse<ILaboratory>>("/laboratories?per_page=100");
  return res.data.data;
};

// Aliases de compatibilidad
export const fetchCategorias = async () => {
  const list = await fetchCategories();
  return list.map((c) => ({
    id_categoria: c.id,
    nombre: c.name,
    descripcion: c.description,
    ...c,
  }));
};

export const fetchPresentaciones = async () => {
  const list = await fetchPresentations();
  return list.map((p) => ({
    id_presentacion: p.id,
    nombre: p.name,
    descripcion: p.description,
    ...p,
  }));
};

export const fetchLaboratorios = async () => {
  const list = await fetchLaboratories();
  return list.map((l) => ({
    id_laboratorio: l.id,
    nombre: l.name,
    pais: l.country,
    telefono: l.phone,
    ...l,
  }));
};
