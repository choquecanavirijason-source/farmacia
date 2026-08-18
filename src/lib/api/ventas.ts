import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import { fetchLotes, restaurarStockPorVenta, seleccionarLoteFEFO, venderDesdeLote } from "@/lib/api/lotes";
import { registrarMovimiento } from "@/lib/api/caja";
import type { DetalleVenta, Factura, FormaPagoNombre, Venta } from "@/lib/types";

const VENTAS_KEY = "ventas";
const DETALLES_KEY = "detalles_venta";
const FACTURAS_KEY = "facturas";

const VENTAS_SEED: Venta[] = [];
const DETALLES_SEED: DetalleVenta[] = [];
const FACTURAS_SEED: Factura[] = [];

function nextId<T>(items: T[], idOf: (item: T) => number): number {
  return items.reduce((max, item) => Math.max(max, idOf(item)), 0) + 1;
}

export async function fetchVentas(): Promise<Venta[]> {
  await delay();
  return readCollection<Venta>(VENTAS_KEY, VENTAS_SEED);
}

export async function fetchDetallesByVenta(id_venta: number): Promise<DetalleVenta[]> {
  await delay();
  const detalles = readCollection<DetalleVenta>(DETALLES_KEY, DETALLES_SEED);
  return detalles.filter((d) => d.id_venta === id_venta);
}

export async function fetchFacturaByVenta(id_venta: number): Promise<Factura | null> {
  await delay();
  const facturas = readCollection<Factura>(FACTURAS_KEY, FACTURAS_SEED);
  return facturas.find((f) => f.id_venta === id_venta) ?? null;
}

export interface VentaItemInput {
  id_medicamento: number;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaInput {
  id_cliente: number;
  id_usuario: number;
  id_caja: number;
  forma_pago: FormaPagoNombre;
  nit_cliente: string;
  razon_social: string;
  items: VentaItemInput[];
}

/**
 * Registra la venta: por cada línea busca el lote FEFO (vencimiento más
 * próximo) con stock suficiente y descuenta de ahí — no reparte una línea
 * entre varios lotes. Genera el movimiento de kardex, el ingreso en caja y
 * la factura correlativa.
 *
 * Primero resuelve y valida el lote de CADA línea (sin escribir nada); solo
 * si todas las líneas tienen stock confirma los descuentos. Si se descontara
 * línea por línea y una posterior fallara, las anteriores quedarían con
 * stock ya restado y kardex ya escrito pero sin ninguna Venta que lo explique.
 */
export async function crearVenta(input: VentaInput): Promise<Venta> {
  await delay();
  if (input.items.length === 0) {
    throw new ApiError("Agrega al menos un producto a la venta.", 400);
  }

  const lotesDisponibles = await fetchLotes();
  const ventas = readCollection<Venta>(VENTAS_KEY, VENTAS_SEED);
  const detalles = readCollection<DetalleVenta>(DETALLES_KEY, DETALLES_SEED);
  const facturas = readCollection<Factura>(FACTURAS_KEY, FACTURAS_SEED);

  const id_venta = nextId(ventas, (v) => v.id_venta);
  let nextDetalleId = nextId(detalles, (d) => d.id_detalle_venta);

  // Paso 1: resolver el lote de cada línea contra una copia en memoria (sin tocar el storage).
  const resueltos: Array<{ item: VentaItemInput; id_lote: number; subtotal: number }> = [];
  let total = 0;
  for (const item of input.items) {
    const lote = seleccionarLoteFEFO(lotesDisponibles, item.id_medicamento, item.cantidad);
    if (!lote) {
      throw new ApiError(
        "No hay stock suficiente en un solo lote para uno de los productos. Reduce la cantidad.",
        409
      );
    }
    lote.cantidad_actual -= item.cantidad; // refleja el consumo para las siguientes líneas de esta misma venta
    const subtotal = item.cantidad * item.precio_unitario;
    total += subtotal;
    resueltos.push({ item, id_lote: lote.id_lote, subtotal });
  }

  // Paso 2: todas las líneas tienen lote válido — recién ahora se descuenta stock de verdad.
  const nuevosDetalles: DetalleVenta[] = [];
  for (const { item, id_lote, subtotal } of resueltos) {
    await venderDesdeLote(id_lote, item.cantidad, `Venta Nº ${id_venta}`);
    nuevosDetalles.push({
      id_detalle_venta: nextDetalleId++,
      id_venta,
      id_medicamento: item.id_medicamento,
      id_lote,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal,
    });
  }

  const nuevaVenta: Venta = {
    id_venta,
    fecha: new Date().toISOString(),
    total,
    estado: "activa",
    id_cliente: input.id_cliente,
    id_usuario: input.id_usuario,
    id_caja: input.id_caja,
    forma_pago: input.forma_pago,
  };

  const nuevaFactura: Factura = {
    id_factura: nextId(facturas, (f) => f.id_factura),
    id_venta,
    numero_factura: String(facturas.length + 1).padStart(6, "0"),
    nit_cliente: input.nit_cliente,
    razon_social: input.razon_social,
    fecha_emision: nuevaVenta.fecha,
    total,
  };

  writeCollection(VENTAS_KEY, [...ventas, nuevaVenta]);
  writeCollection(DETALLES_KEY, [...detalles, ...nuevosDetalles]);
  writeCollection(FACTURAS_KEY, [...facturas, nuevaFactura]);

  await registrarMovimiento(input.id_caja, "ingreso", total, `Venta Nº ${id_venta}`);

  return nuevaVenta;
}

export async function anularVenta(id_venta: number): Promise<Venta> {
  await delay();
  const ventas = readCollection<Venta>(VENTAS_KEY, VENTAS_SEED);
  const venta = ventas.find((v) => v.id_venta === id_venta);
  if (!venta) {
    throw new ApiError("La venta ya no existe.", 404);
  }
  if (venta.estado !== "activa") {
    throw new ApiError("Esta venta ya está anulada.", 409);
  }

  const detalles = readCollection<DetalleVenta>(DETALLES_KEY, DETALLES_SEED).filter(
    (d) => d.id_venta === id_venta
  );
  for (const d of detalles) {
    await restaurarStockPorVenta(d.id_lote, d.cantidad, `Anulación de venta Nº ${id_venta}`);
  }

  // Compensa el ingreso en caja solo si la caja de esa venta sigue abierta;
  // si ya se cerró, el historial de esa caja queda intacto (igual que Compras).
  try {
    await registrarMovimiento(venta.id_caja, "egreso", venta.total, `Anulación de venta Nº ${id_venta}`);
  } catch {
    // caja ya cerrada — no se puede ajustar retroactivamente, se documenta solo en la venta.
  }

  const actualizada: Venta = { ...venta, estado: "anulada" };
  writeCollection(
    VENTAS_KEY,
    ventas.map((v) => (v.id_venta === id_venta ? actualizada : v))
  );
  return actualizada;
}
