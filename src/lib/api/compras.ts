import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import { createLote, fetchLotes } from "@/lib/api/lotes";
import type { Compra, DetalleCompra } from "@/lib/types";

const COMPRAS_KEY = "compras";
const DETALLES_KEY = "detalles_compra";

const COMPRAS_SEED: Compra[] = [];
const DETALLES_SEED: DetalleCompra[] = [];

export async function fetchCompras(): Promise<Compra[]> {
  await delay();
  return readCollection<Compra>(COMPRAS_KEY, COMPRAS_SEED);
}

export async function fetchDetallesByCompra(id_compra: number): Promise<DetalleCompra[]> {
  await delay();
  const detalles = readCollection<DetalleCompra>(DETALLES_KEY, DETALLES_SEED);
  return detalles.filter((d) => d.id_compra === id_compra);
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

function nextId<T>(items: T[], idOf: (item: T) => number): number {
  return items.reduce((max, item) => Math.max(max, idOf(item)), 0) + 1;
}

function assertFacturaUnica(compras: Compra[], numeroFactura: string, idProveedor: number) {
  const exists = compras.some(
    (c) => c.numero_factura.toLowerCase() === numeroFactura.toLowerCase() && c.id_proveedor === idProveedor
  );
  if (exists) {
    throw new ApiError(`Ya registraste la factura "${numeroFactura}" para este proveedor.`, 409);
  }
}

/**
 * Registra una compra: crea la Compra, y por cada línea crea un Lote nuevo
 * (que a su vez genera su movimiento de entrada en el kardex) más su
 * DetalleCompra correspondiente. No hay edición/eliminación de compras
 * confirmadas — igual que un sistema real, revertir requiere una nota de
 * crédito o ajuste de inventario, no borrar el historial.
 *
 * Valida que ningún N° de lote esté repetido (contra lo ya guardado y entre
 * las propias líneas de esta compra) ANTES de crear el primer lote — si se
 * validara línea por línea, una línea posterior inválida dejaría lotes
 * previos creados sin ninguna Compra que los explique.
 */
export async function createCompra(input: CompraInput): Promise<Compra> {
  await delay();
  if (input.items.length === 0) {
    throw new ApiError("Agrega al menos un medicamento a la compra.", 400);
  }

  const compras = readCollection<Compra>(COMPRAS_KEY, COMPRAS_SEED);
  assertFacturaUnica(compras, input.numero_factura, input.id_proveedor);

  const lotesExistentes = await fetchLotes();
  const vistos = new Set<string>();
  for (const item of input.items) {
    const clave = `${item.id_medicamento}:${item.numero_lote.toLowerCase()}`;
    if (vistos.has(clave)) {
      throw new ApiError(`El N° de lote "${item.numero_lote}" está repetido en esta compra.`, 400);
    }
    vistos.add(clave);
    const yaExiste = lotesExistentes.some(
      (l) => l.id_medicamento === item.id_medicamento && l.numero_lote.toLowerCase() === item.numero_lote.toLowerCase()
    );
    if (yaExiste) {
      throw new ApiError(`Este medicamento ya tiene un lote con número "${item.numero_lote}".`, 409);
    }
  }

  const detalles = readCollection<DetalleCompra>(DETALLES_KEY, DETALLES_SEED);
  const id_compra = nextId(compras, (c) => c.id_compra);
  let nextDetalleId = nextId(detalles, (d) => d.id_detalle_compra);

  const nuevosDetalles: DetalleCompra[] = [];
  let total = 0;

  for (const item of input.items) {
    const lote = await createLote(
      {
        numero_lote: item.numero_lote,
        fecha_vencimiento: item.fecha_vencimiento,
        precio_compra: item.precio_unitario,
        id_medicamento: item.id_medicamento,
        cantidad_actual: item.cantidad,
      },
      `Compra Nº ${input.numero_factura}`
    );
    const subtotal = item.cantidad * item.precio_unitario;
    total += subtotal;
    nuevosDetalles.push({
      id_detalle_compra: nextDetalleId++,
      id_compra,
      id_medicamento: item.id_medicamento,
      id_lote: lote.id_lote,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal,
    });
  }

  const nuevaCompra: Compra = {
    id_compra,
    numero_factura: input.numero_factura,
    fecha: input.fecha,
    total,
    id_proveedor: input.id_proveedor,
  };

  writeCollection(COMPRAS_KEY, [...compras, nuevaCompra]);
  writeCollection(DETALLES_KEY, [...detalles, ...nuevosDetalles]);

  return nuevaCompra;
}
