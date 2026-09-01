import apiClient from "@/config/axios";
import type { ICategory } from "@/lib/types/category";
import type { IPresentation } from "@/lib/types/presentation";
import type { ILaboratory } from "@/lib/types/laboratory";
import type { IPaginatedResponse } from "@/lib/types/pagination";

let categoriesPromise: Promise<ICategory[]> | null = null;
let presentationsPromise: Promise<IPresentation[]> | null = null;
let laboratoriesPromise: Promise<ILaboratory[]> | null = null;

export const fetchCategories = async (forceRefresh = false): Promise<ICategory[]> => {
  if (!forceRefresh && categoriesPromise) return categoriesPromise;

  categoriesPromise = apiClient
    .get<IPaginatedResponse<ICategory>>("/categories?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        categoriesPromise = null;
      }, 1000);
    });

  return categoriesPromise;
};

export const fetchPresentations = async (forceRefresh = false): Promise<IPresentation[]> => {
  if (!forceRefresh && presentationsPromise) return presentationsPromise;

  presentationsPromise = apiClient
    .get<IPaginatedResponse<IPresentation>>("/presentations?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        presentationsPromise = null;
      }, 1000);
    });

  return presentationsPromise;
};

export const fetchLaboratories = async (forceRefresh = false): Promise<ILaboratory[]> => {
  if (!forceRefresh && laboratoriesPromise) return laboratoriesPromise;

  laboratoriesPromise = apiClient
    .get<IPaginatedResponse<ILaboratory>>("/laboratories?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        laboratoriesPromise = null;
      }, 1000);
    });

  return laboratoriesPromise;
};

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
