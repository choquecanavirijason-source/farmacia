import { apiFetch } from "@/lib/api/http";
import type { Cliente, PaginatedResponse } from "@/lib/types";

export async function fetchClientes(): Promise<Cliente[]> {
  return apiFetch<Cliente[]>("/clientes");
}

export interface ClientePageParams {
  page: number;
  pageSize: number;
  search: string;
  sort: { key: string; direction: "asc" | "desc" } | null;
}

export async function fetchClientesPage(
  { page, pageSize, search, sort }: ClientePageParams,
  signal?: AbortSignal
): Promise<{ items: Cliente[]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(pageSize),
  });
  if (search.trim()) params.set("search", search.trim());
  if (sort) {
    params.set("sort_by", sort.key);
    params.set("sort_dir", sort.direction);
  }

  const res = await apiFetch<PaginatedResponse<Cliente>>(`/clientes?${params}`, { signal });
  return { items: res.data, total: res.total };
}

export type ClienteInput = Omit<Cliente, "id_cliente" | "fecha_registro">;

export async function createCliente(input: ClienteInput): Promise<Cliente> {
  return apiFetch<Cliente>("/clientes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCliente(id: number, input: Partial<ClienteInput>): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteCliente(id: number): Promise<void> {
  await apiFetch<void>(`/clientes/${id}`, { method: "DELETE" });
}

export async function deleteClientes(ids: number[]): Promise<{ deleted: number; message: string }> {
  return apiFetch<{ deleted: number; message: string }>("/clientes", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}