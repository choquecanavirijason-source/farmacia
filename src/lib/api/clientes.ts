import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import type { Cliente } from "@/lib/types";

const CLIENTES_KEY = "clientes";

/** "Consumidor Final" es el cliente genérico para ventas sin datos — patrón estándar de POS. */
const CLIENTES_SEED: Cliente[] = [
  { id_cliente: 1, nombre: "Consumidor Final", ci_nit: "0", telefono: "", direccion: "" },
  { id_cliente: 2, nombre: "María Condori Quispe", ci_nit: "5487621", telefono: "71234567", direccion: "Calle Chuquisaca #212, Potosí" },
  { id_cliente: 3, nombre: "Juan Pérez Mamani", ci_nit: "6123890", telefono: "76543210", direccion: "Av. Universitaria #88, Potosí" },
];

export async function fetchClientes(): Promise<Cliente[]> {
  await delay();
  return readCollection<Cliente>(CLIENTES_KEY, CLIENTES_SEED);
}

export type ClienteInput = Omit<Cliente, "id_cliente">;

function nextId(clientes: Cliente[]): number {
  return clientes.reduce((max, c) => Math.max(max, c.id_cliente), 0) + 1;
}

function assertCiNitUnico(clientes: Cliente[], ciNit: string, ignoreId?: number) {
  const exists = clientes.some((c) => c.ci_nit === ciNit && c.id_cliente !== ignoreId);
  if (exists) {
    throw new ApiError(`Ya existe un cliente con el CI/NIT "${ciNit}".`, 409);
  }
}

export async function createCliente(input: ClienteInput): Promise<Cliente> {
  await delay();
  const clientes = readCollection<Cliente>(CLIENTES_KEY, CLIENTES_SEED);
  assertCiNitUnico(clientes, input.ci_nit);
  const nuevo: Cliente = { ...input, id_cliente: nextId(clientes) };
  writeCollection(CLIENTES_KEY, [...clientes, nuevo]);
  return nuevo;
}

export async function updateCliente(id: number, input: ClienteInput): Promise<Cliente> {
  await delay();
  const clientes = readCollection<Cliente>(CLIENTES_KEY, CLIENTES_SEED);
  assertCiNitUnico(clientes, input.ci_nit, id);
  const actualizado: Cliente = { ...input, id_cliente: id };
  writeCollection(
    CLIENTES_KEY,
    clientes.map((c) => (c.id_cliente === id ? actualizado : c))
  );
  return actualizado;
}

export async function deleteCliente(id: number): Promise<void> {
  await delay();
  if (id === 1) {
    throw new ApiError('No se puede eliminar el cliente genérico "Consumidor Final".', 409);
  }
  const clientes = readCollection<Cliente>(CLIENTES_KEY, CLIENTES_SEED);
  writeCollection(
    CLIENTES_KEY,
    clientes.filter((c) => c.id_cliente !== id)
  );
}
