import { apiFetch } from "@/lib/api/http";
import type { Proveedor } from "@/lib/types";

export async function fetchProveedores(): Promise<Proveedor[]> {
  return apiFetch<Proveedor[]>("/proveedores");
}

export type ProveedorInput = Omit<Proveedor, "id_proveedor">;

export async function createProveedor(input: ProveedorInput): Promise<Proveedor> {
  return apiFetch<Proveedor>("/proveedores", { method: "POST", body: JSON.stringify(input) });
}

export async function updateProveedor(id: number, input: ProveedorInput): Promise<Proveedor> {
  return apiFetch<Proveedor>(`/proveedores/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteProveedor(id: number): Promise<void> {
  await apiFetch<void>(`/proveedores/${id}`, { method: "DELETE" });
}
