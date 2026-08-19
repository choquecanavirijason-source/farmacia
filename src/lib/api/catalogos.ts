import { apiFetch } from "@/lib/api/http";
import type { Categoria, Laboratorio, Presentacion } from "@/lib/types";

// ---------- Categorías ----------

export async function fetchCategorias(): Promise<Categoria[]> {
  return apiFetch<Categoria[]>("/categorias");
}

export type CategoriaInput = Omit<Categoria, "id_categoria">;

export async function createCategoria(input: CategoriaInput): Promise<Categoria> {
  return apiFetch<Categoria>("/categorias", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCategoria(id: number, input: CategoriaInput): Promise<Categoria> {
  return apiFetch<Categoria>(`/categorias/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteCategoria(id: number): Promise<void> {
  await apiFetch<void>(`/categorias/${id}`, { method: "DELETE" });
}

// ---------- Presentaciones ----------

export async function fetchPresentaciones(): Promise<Presentacion[]> {
  return apiFetch<Presentacion[]>("/presentaciones");
}

export type PresentacionInput = Omit<Presentacion, "id_presentacion">;

export async function createPresentacion(input: PresentacionInput): Promise<Presentacion> {
  return apiFetch<Presentacion>("/presentaciones", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePresentacion(id: number, input: PresentacionInput): Promise<Presentacion> {
  return apiFetch<Presentacion>(`/presentaciones/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deletePresentacion(id: number): Promise<void> {
  await apiFetch<void>(`/presentaciones/${id}`, { method: "DELETE" });
}

// ---------- Laboratorios ----------

export async function fetchLaboratorios(): Promise<Laboratorio[]> {
  return apiFetch<Laboratorio[]>("/laboratorios");
}

export type LaboratorioInput = Omit<Laboratorio, "id_laboratorio">;

export async function createLaboratorio(input: LaboratorioInput): Promise<Laboratorio> {
  return apiFetch<Laboratorio>("/laboratorios", { method: "POST", body: JSON.stringify(input) });
}

export async function updateLaboratorio(id: number, input: LaboratorioInput): Promise<Laboratorio> {
  return apiFetch<Laboratorio>(`/laboratorios/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteLaboratorio(id: number): Promise<void> {
  await apiFetch<void>(`/laboratorios/${id}`, { method: "DELETE" });
}
