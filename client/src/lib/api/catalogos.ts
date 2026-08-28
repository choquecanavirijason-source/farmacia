import { apiFetch } from "@/lib/api/http";
import type { Categoria, Laboratorio, Presentacion } from "@/lib/types";

// ---------- Categorías ----------

export async function fetchCategorias(): Promise<Categoria[]> {
  const response = await apiFetch<{ data: ServerCategory[] }>(
    "/categories?per_page=100",
  );
  return response.data.map((item) => ({
    id_categoria: item.id,
    nombre: item.name,
    descripcion: item.description ?? "",
  }));
}

export async function fetchCategoriasPage(
  params: {
    page: number;
    pageSize: number;
    search: string;
    sort: { key: string; direction: "asc" | "desc" } | null;
  },
  signal?: AbortSignal,
): Promise<{ items: Categoria[]; total: number }> {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(params.pageSize),
  });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.sort) {
    query.set("sort_by", params.sort.key);
    query.set("sort_dir", params.sort.direction);
  }
  const response = await apiFetch<{
    data: ServerCategory[];
    meta: { total: number };
  }>(`/categories?${query}`, { signal });
  return {
    items: response.data.map((item) => ({
      id_categoria: item.id,
      nombre: item.name,
      descripcion: item.description ?? "",
    })),
    total: response.meta.total,
  };
}

export type CategoriaInput = Omit<Categoria, "id_categoria">;

export async function createCategoria(
  input: CategoriaInput,
): Promise<Categoria> {
  const response = await apiFetch<{ data: ServerCategory }>("/categories", {
    method: "POST",
    body: JSON.stringify({
      name: input.nombre,
      description: input.descripcion,
    }),
  });
  return {
    id_categoria: response.data.id,
    nombre: response.data.name,
    descripcion: response.data.description ?? "",
  };
}

export async function updateCategoria(
  id: number,
  input: CategoriaInput,
): Promise<Categoria> {
  const response = await apiFetch<{ data: ServerCategory }>(
    `/categories/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: input.nombre,
        description: input.descripcion,
      }),
    },
  );
  return {
    id_categoria: response.data.id,
    nombre: response.data.name,
    descripcion: response.data.description ?? "",
  };
}

export async function deleteCategoria(id: number): Promise<void> {
  await apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
}

// ---------- Presentaciones ----------

export async function fetchPresentaciones(): Promise<Presentacion[]> {
  const response = await apiFetch<{ data: ServerPresentation[] }>(
    "/presentations?per_page=100",
  );
  return response.data.map((item) => ({
    id_presentacion: item.id,
    nombre: item.name,
    descripcion: item.description ?? "",
  }));
}

export type PresentacionInput = Omit<Presentacion, "id_presentacion">;

export async function createPresentacion(
  input: PresentacionInput,
): Promise<Presentacion> {
  const response = await apiFetch<{ data: ServerPresentation }>(
    "/presentations",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.nombre,
        description: input.descripcion,
      }),
    },
  );
  return {
    id_presentacion: response.data.id,
    nombre: response.data.name,
    descripcion: response.data.description ?? "",
  };
}

export async function updatePresentacion(
  id: number,
  input: PresentacionInput,
): Promise<Presentacion> {
  const response = await apiFetch<{ data: ServerPresentation }>(
    `/presentations/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: input.nombre,
        description: input.descripcion,
      }),
    },
  );
  return {
    id_presentacion: response.data.id,
    nombre: response.data.name,
    descripcion: response.data.description ?? "",
  };
}

export async function deletePresentacion(id: number): Promise<void> {
  await apiFetch<void>(`/presentations/${id}`, { method: "DELETE" });
}

// ---------- Laboratorios ----------

export async function fetchLaboratorios(): Promise<Laboratorio[]> {
  const response = await apiFetch<{ data: ServerLaboratory[] }>(
    "/laboratories?per_page=100",
  );
  return response.data.map((item) => ({
    id_laboratorio: item.id,
    nombre: item.name,
    pais: item.country ?? "",
    telefono: item.phone ?? "",
  }));
}

export type LaboratorioInput = Omit<Laboratorio, "id_laboratorio">;

export async function createLaboratorio(
  input: LaboratorioInput,
): Promise<Laboratorio> {
  const response = await apiFetch<{ data: ServerLaboratory }>("/laboratories", {
    method: "POST",
    body: JSON.stringify({
      name: input.nombre,
      country: input.pais,
      phone: input.telefono,
    }),
  });
  return {
    id_laboratorio: response.data.id,
    nombre: response.data.name,
    pais: response.data.country ?? "",
    telefono: response.data.phone ?? "",
  };
}

export async function updateLaboratorio(
  id: number,
  input: LaboratorioInput,
): Promise<Laboratorio> {
  const response = await apiFetch<{ data: ServerLaboratory }>(
    `/laboratories/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: input.nombre,
        country: input.pais,
        phone: input.telefono,
      }),
    },
  );
  return {
    id_laboratorio: response.data.id,
    nombre: response.data.name,
    pais: response.data.country ?? "",
    telefono: response.data.phone ?? "",
  };
}

export async function deleteLaboratorio(id: number): Promise<void> {
  await apiFetch<void>(`/laboratories/${id}`, { method: "DELETE" });
}

interface ServerCategory {
  id: number;
  name: string;
  description: string | null;
}
interface ServerPresentation {
  id: number;
  name: string;
  description: string | null;
}
interface ServerLaboratory {
  id: number;
  name: string;
  country: string | null;
  phone: string | null;
}
