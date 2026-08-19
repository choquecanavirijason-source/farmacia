import { apiFetch } from "@/lib/api/http";
import type { Compra, DetalleCompra } from "@/lib/types";

interface CompraApi extends Omit<Compra, "total" | "fecha"> {
  total: string;
  fecha: string;
}

function toCompra(c: CompraApi): Compra {
  return { ...c, total: Number(c.total), fecha: c.fecha.slice(0, 10) };
}

interface DetalleCompraApi extends Omit<DetalleCompra, "precio_unitario" | "subtotal"> {
  precio_unitario: string;
  subtotal: string;
}

function toDetalle(d: DetalleCompraApi): DetalleCompra {
  return { ...d, precio_unitario: Number(d.precio_unitario), subtotal: Number(d.subtotal) };
}

export async function fetchCompras(): Promise<Compra[]> {
  const data = await apiFetch<CompraApi[]>("/compras");
  return data.map(toCompra);
}

export async function fetchDetallesByCompra(id_compra: number): Promise<DetalleCompra[]> {
  const data = await apiFetch<DetalleCompraApi[]>(`/compras/${id_compra}/detalles`);
  return data.map(toDetalle);
}

export interface CompraItemInput {
  id_medicamento: number;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CompraInput {
  id_proveedor: number;
  numero_factura: string;
  fecha: string;
  items: CompraItemInput[];
}

/**
 * Registra una compra: el backend crea la Compra y, por cada línea, un Lote
 * nuevo (con su entrada de kardex) más su DetalleCompra, todo en una sola
 * transacción. No hay edición/eliminación de compras confirmadas — igual que
 * un sistema real, revertir requiere una nota de crédito o ajuste de
 * inventario, no borrar el historial.
 */
export async function createCompra(input: CompraInput): Promise<Compra> {
  if (input.items.length === 0) {
    throw new Error("Agrega al menos un medicamento a la compra.");
  }
  const data = await apiFetch<CompraApi>("/compras", { method: "POST", body: JSON.stringify(input) });
  return toCompra(data);
}
