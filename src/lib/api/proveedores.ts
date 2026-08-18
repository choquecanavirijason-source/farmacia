import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import type { Proveedor } from "@/lib/types";

const PROVEEDORES_KEY = "proveedores";

const PROVEEDORES_SEED: Proveedor[] = [
  {
    id_proveedor: 1,
    nombre: "Distribuidora Boliviana de Medicamentos",
    nit: "1023456011",
    telefono: "22334455",
    direccion: "Av. Circunvalación #123, Potosí",
    email: "ventas@dibolmed.bo",
  },
  {
    id_proveedor: 2,
    nombre: "Droguería Inti S.R.L.",
    nit: "1078965022",
    telefono: "22558899",
    direccion: "Calle Bolívar #456, Potosí",
    email: "contacto@drogueriainti.bo",
  },
];

export async function fetchProveedores(): Promise<Proveedor[]> {
  await delay();
  return readCollection<Proveedor>(PROVEEDORES_KEY, PROVEEDORES_SEED);
}

export type ProveedorInput = Omit<Proveedor, "id_proveedor">;

function nextId(proveedores: Proveedor[]): number {
  return proveedores.reduce((max, p) => Math.max(max, p.id_proveedor), 0) + 1;
}

function assertNitUnico(proveedores: Proveedor[], nit: string, ignoreId?: number) {
  const exists = proveedores.some((p) => p.nit === nit && p.id_proveedor !== ignoreId);
  if (exists) {
    throw new ApiError(`Ya existe un proveedor con el NIT "${nit}".`, 409);
  }
}

export async function createProveedor(input: ProveedorInput): Promise<Proveedor> {
  await delay();
  const proveedores = readCollection<Proveedor>(PROVEEDORES_KEY, PROVEEDORES_SEED);
  assertNitUnico(proveedores, input.nit);
  const nuevo: Proveedor = { ...input, id_proveedor: nextId(proveedores) };
  writeCollection(PROVEEDORES_KEY, [...proveedores, nuevo]);
  return nuevo;
}

export async function updateProveedor(id: number, input: ProveedorInput): Promise<Proveedor> {
  await delay();
  const proveedores = readCollection<Proveedor>(PROVEEDORES_KEY, PROVEEDORES_SEED);
  assertNitUnico(proveedores, input.nit, id);
  const actualizado: Proveedor = { ...input, id_proveedor: id };
  writeCollection(
    PROVEEDORES_KEY,
    proveedores.map((p) => (p.id_proveedor === id ? actualizado : p))
  );
  return actualizado;
}

export async function deleteProveedor(id: number): Promise<void> {
  await delay();
  const proveedores = readCollection<Proveedor>(PROVEEDORES_KEY, PROVEEDORES_SEED);
  writeCollection(
    PROVEEDORES_KEY,
    proveedores.filter((p) => p.id_proveedor !== id)
  );
}
