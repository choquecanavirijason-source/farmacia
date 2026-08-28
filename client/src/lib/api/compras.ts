import { apiFetch } from "@/lib/api/http";
import type { Compra, DetalleCompra } from "@/lib/types";

interface CompraApi {
  id: number;
  invoice_number: string;
  purchase_date: string;
  total: string | number;
  supplier_id: number;
}

function toCompra(c: CompraApi): Compra {
  return {
    id_compra: c.id,
    numero_factura: c.invoice_number,
    fecha: c.purchase_date.slice(0, 10),
    total: Number(c.total),
    id_proveedor: c.supplier_id,
  };
}

interface DetalleCompraApi {
  id: number;
  purchase_id: number;
  medicament_id: number;
  batch_id: number;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

function toDetalle(d: DetalleCompraApi): DetalleCompra {
  return {
    id_detalle_compra: d.id,
    id_compra: d.purchase_id,
    id_medicamento: d.medicament_id,
    id_lote: d.batch_id,
    cantidad: d.quantity,
    precio_unitario: Number(d.unit_price),
    subtotal: Number(d.subtotal),
  };
}

export async function fetchCompras(): Promise<Compra[]> {
  const response = await apiFetch<{ data: CompraApi[] }>(
    "/purchases?per_page=100",
  );
  return response.data.map(toCompra);
}

export async function fetchDetallesByCompra(
  id_compra: number,
): Promise<DetalleCompra[]> {
  const data = await apiFetch<DetalleCompraApi[]>(
    `/purchases/${id_compra}/details`,
  );
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
  const response = await apiFetch<CompraApi>("/purchases", {
    method: "POST",
    body: JSON.stringify({
      supplier_id: input.id_proveedor,
      invoice_number: input.numero_factura,
      purchase_date: input.fecha,
      items: input.items.map((item) => ({
        medicament_id: item.id_medicamento,
        batch_number: item.numero_lote,
        expiration_date: item.fecha_vencimiento,
        quantity: item.cantidad,
        unit_price: item.precio_unitario,
      })),
    }),
  });
  return toCompra(response);
}
