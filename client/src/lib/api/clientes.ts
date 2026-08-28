import { apiFetch, downloadFile } from "@/lib/api/http";
import type { Cliente } from "@/lib/types";

/** Respuesta de `ClienteResource::collection($paginator)`: { data, meta: { total } }. */
export interface ClientePageResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export async function fetchClientes(): Promise<Cliente[]> {
  const res = await apiFetch<ClientePageResponse<Cliente>>("/clientes");
  return res.data;
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

  const res = await apiFetch<ClientePageResponse<Cliente>>(`/clientes?${params}`, { signal });
  return { items: res.data, total: res.meta.total };
}

export type ClienteInput = Omit<Cliente, "id_cliente" | "created_at">;
export async function updateClientesOrder(orderedIds: number[]): Promise<void> {
  await apiFetch('/clientes/reorder', { method: 'PATCH', body: JSON.stringify({ orderedIds }) });
}
export async function exportClientes(
  formato: "excel" | "pdf",
  params: { search: string; sort: { key: string; direction: "asc" | "desc" } | null }
): Promise<void> {
  const query = new URLSearchParams({ formato });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.sort) {
    query.set("sort_by", params.sort.key);
    query.set("sort_dir", params.sort.direction);
  }
  const extension = formato === "excel" ? "xlsx" : "pdf";
  await downloadFile(`/clientes/exportar?${query}`, `clientes.${extension}`);
}

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