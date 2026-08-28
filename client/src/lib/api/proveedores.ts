import { apiFetch } from "@/lib/api/http";
import type { Proveedor } from "@/lib/types";

export async function fetchProveedores(): Promise<Proveedor[]> {
  const response = await apiFetch<{ data: ServerSupplier[] }>(
    "/suppliers?per_page=100",
  );
  return response.data.map(toProveedor);
}

export async function fetchProveedoresPage(
  params: {
    page: number;
    pageSize: number;
    search: string;
    sort: { key: string; direction: "asc" | "desc" } | null;
  },
  signal?: AbortSignal,
): Promise<{ items: Proveedor[]; total: number }> {
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
    data: ServerSupplier[];
    meta: { total: number };
  }>(`/suppliers?${query}`, { signal });
  return { items: response.data.map(toProveedor), total: response.meta.total };
}

export type ProveedorInput = Omit<Proveedor, "id_proveedor">;

export async function createProveedor(
  input: ProveedorInput,
): Promise<Proveedor> {
  const response = await apiFetch<{ data: ServerSupplier }>("/suppliers", {
    method: "POST",
    body: JSON.stringify(toServerSupplier(input)),
  });
  return toProveedor(response.data);
}

export async function updateProveedor(
  id: number,
  input: ProveedorInput,
): Promise<Proveedor> {
  const response = await apiFetch<{ data: ServerSupplier }>(
    `/suppliers/${id}`,
    { method: "PUT", body: JSON.stringify(toServerSupplier(input)) },
  );
  return toProveedor(response.data);
}

export async function deleteProveedor(id: number): Promise<void> {
  await apiFetch<void>(`/suppliers/${id}`, { method: "DELETE" });
}

interface ServerSupplier {
  id: number;
  name: string;
  nit: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
}
function toProveedor(supplier: ServerSupplier): Proveedor {
  return {
    id_proveedor: supplier.id,
    nombre: supplier.name,
    nit: supplier.nit ?? "",
    telefono: supplier.phone ?? "",
    direccion: supplier.address ?? "",
    email: supplier.email ?? "",
  };
}
function toServerSupplier(input: ProveedorInput) {
  return {
    name: input.nombre,
    nit: input.nit,
    phone: input.telefono,
    address: input.direccion,
    email: input.email,
  };
}
