import { apiFetch } from "@/lib/api/http";
import type { Cliente } from "@/lib/types";

export async function fetchClientes(): Promise<Cliente[]> {
  return apiFetch<Cliente[]>("/clientes");
}

export type ClienteInput = Omit<Cliente, "id_cliente">;

export async function createCliente(input: ClienteInput): Promise<Cliente> {
  return apiFetch<Cliente>("/clientes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCliente(id: number, input: ClienteInput): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteCliente(id: number): Promise<void> {
  await apiFetch<void>(`/clientes/${id}`, { method: "DELETE" });
}
