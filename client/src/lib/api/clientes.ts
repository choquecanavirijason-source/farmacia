import { apiFetch, downloadFile } from "@/lib/api/http";
import type { Cliente } from "@/lib/types";

/** Respuesta paginada estándar de Laravel. */
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
  const res = await apiFetch<ClientePageResponse<ServerClient>>(
    "/clients?per_page=100",
  );
  return res.data.map(toCliente);
}

export interface ClientePageParams {
  page: number;
  pageSize: number;
  search: string;
  sort: { key: string; direction: "asc" | "desc" } | null;
}

export async function fetchClientesPage(
  { page, pageSize, search, sort }: ClientePageParams,
  signal?: AbortSignal,
): Promise<{ items: Cliente[]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(pageSize),
  });
  if (search.trim()) params.set("search", search.trim());
  if (sort) {
    params.set("sort_by", clientSortColumn(sort.key));
    params.set("sort_dir", sort.direction);
  }

  const res = await apiFetch<ClientePageResponse<ServerClient>>(
    `/clients?${params}`,
    { signal },
  );
  return { items: res.data.map(toCliente), total: res.meta.total };
}

export type ClienteInput = Omit<Cliente, "id_cliente" | "created_at">;
export async function exportClientes(
  formato: "excel" | "pdf",
  params: {
    search: string;
    sort: { key: string; direction: "asc" | "desc" } | null;
  },
): Promise<void> {
  const query = new URLSearchParams({ format: formato });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.sort) {
    query.set("sort_by", clientSortColumn(params.sort.key));
    query.set("sort_dir", params.sort.direction);
  }
  const extension = formato === "excel" ? "xlsx" : "pdf";
  await downloadFile(`/clients/export?${query}`, `clients.${extension}`);
}

export async function createCliente(input: ClienteInput): Promise<Cliente> {
  const response = await apiFetch<{ data: ServerClient }>("/clients", {
    method: "POST",
    body: JSON.stringify(toServerClient(input)),
  });
  return toCliente(response.data);
}

export async function updateCliente(
  id: number,
  input: Partial<ClienteInput>,
): Promise<Cliente> {
  const response = await apiFetch<{ data: ServerClient }>(`/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(toServerClient(input)),
  });
  return toCliente(response.data);
}

export async function deleteCliente(id: number): Promise<void> {
  await apiFetch<void>(`/clients/${id}`, { method: "DELETE" });
}

export async function deleteClientes(
  ids: number[],
): Promise<{ deleted: number; message: string }> {
  await Promise.all(ids.map((id) => deleteCliente(id)));
  return { deleted: ids.length, message: "Clients deleted." };
}

interface ServerClient {
  id: number;
  firstname: string;
  lastname: string;
  ci: string | null;
  nit: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

function toCliente(client: ServerClient): Cliente {
  return {
    id_cliente: client.id,
    nombre: `${client.firstname} ${client.lastname}`,
    ci_nit: client.ci ?? client.nit ?? "",
    telefono: client.phone ?? "",
    direccion: client.address ?? "",
    created_at: client.created_at,
  };
}

function toServerClient(input: Partial<ClienteInput>): Partial<ServerClient> {
  const [firstname = "", ...lastnameParts] = String(input.nombre ?? "")
    .trim()
    .split(/\s+/);
  return {
    firstname,
    lastname: lastnameParts.join(" ") || firstname,
    ci: input.ci_nit || null,
    phone: input.telefono || null,
    address: input.direccion || null,
  };
}

function clientSortColumn(column: string): string {
  return (
    {
      ci_nit: "ci",
      nombre: "firstname",
      telefono: "phone",
      direccion: "address",
    }[column] ?? column
  );
}
