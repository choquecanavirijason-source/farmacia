import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import type { KardexMovimiento, Lote, Medicamento } from "@/lib/types";

const LOTES_KEY = "lotes";
const KARDEX_KEY = "kardex";

/** Ventana de "próximo a vencer" usada en alertas y badges de la tabla. */
export const DIAS_ALERTA_VENCIMIENTO = 30;

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Fechas relativas a "hoy" (no fijas) para que las alertas de vencimiento se
 * vean realistas sin importar cuándo se ejecute la app.
 */
const LOTES_SEED: Lote[] = [
  { id_lote: 1, numero_lote: "L-2024-001", fecha_vencimiento: isoDaysFromNow(400), cantidad_actual: 120, precio_compra: 7.2, id_medicamento: 1 },
  { id_lote: 2, numero_lote: "L-2024-002", fecha_vencimiento: isoDaysFromNow(18), cantidad_actual: 15, precio_compra: 7.5, id_medicamento: 1 },
  { id_lote: 3, numero_lote: "L-2024-010", fecha_vencimiento: isoDaysFromNow(250), cantidad_actual: 40, precio_compra: 16, id_medicamento: 2 },
  { id_lote: 4, numero_lote: "L-2024-015", fecha_vencimiento: isoDaysFromNow(90), cantidad_actual: 25, precio_compra: 20, id_medicamento: 3 },
  { id_lote: 5, numero_lote: "L-2024-020", fecha_vencimiento: isoDaysFromNow(-5), cantidad_actual: 8, precio_compra: 9.8, id_medicamento: 4 },
  { id_lote: 6, numero_lote: "L-2024-021", fecha_vencimiento: isoDaysFromNow(300), cantidad_actual: 60, precio_compra: 10.1, id_medicamento: 4 },
];

const KARDEX_SEED: KardexMovimiento[] = LOTES_SEED.map((lote, i) => ({
  id_movimiento: i + 1,
  id_lote: lote.id_lote,
  tipo: "entrada",
  cantidad: lote.cantidad_actual,
  saldo: lote.cantidad_actual,
  motivo: "Registro inicial de lote",
  fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
}));

export async function fetchLotes(): Promise<Lote[]> {
  await delay();
  return readCollection<Lote>(LOTES_KEY, LOTES_SEED);
}

export async function fetchKardexByLote(id_lote: number): Promise<KardexMovimiento[]> {
  await delay();
  const kardex = readCollection<KardexMovimiento>(KARDEX_KEY, KARDEX_SEED);
  return kardex
    .filter((k) => k.id_lote === id_lote)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export interface KardexMovimientoConLote extends KardexMovimiento {
  numero_lote: string;
}

/** Kardex combinado de todos los lotes de un medicamento — usado en el reporte por medicamento. */
export async function fetchKardexByMedicamento(id_medicamento: number): Promise<KardexMovimientoConLote[]> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED).filter(
    (l) => l.id_medicamento === id_medicamento
  );
  const loteById = new Map(lotes.map((l) => [l.id_lote, l.numero_lote]));
  const kardex = readCollection<KardexMovimiento>(KARDEX_KEY, KARDEX_SEED);
  return kardex
    .filter((k) => loteById.has(k.id_lote))
    .map((k) => ({ ...k, numero_lote: loteById.get(k.id_lote)! }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/** Días calendario hasta una fecha (negativo si ya pasó). */
export function diasHasta(fechaIso: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaIso);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

/** Lotes vencidos o dentro de la ventana de alerta, con stock > 0, ordenados por urgencia. */
export function computeProximosAVencer(lotes: Lote[], diasVentana = DIAS_ALERTA_VENCIMIENTO): Lote[] {
  return lotes
    .filter((l) => l.cantidad_actual > 0 && diasHasta(l.fecha_vencimiento) <= diasVentana)
    .sort((a, b) => diasHasta(a.fecha_vencimiento) - diasHasta(b.fecha_vencimiento));
}

export interface StockBajoItem {
  medicamento: Medicamento;
  stock: number;
}

/** Medicamentos cuya suma de stock por lote no alcanza su stock mínimo configurado. */
export function computeStockBajo(medicamentos: Medicamento[], lotes: Lote[]): StockBajoItem[] {
  const porMedicamento = new Map<number, number>();
  for (const l of lotes) {
    porMedicamento.set(l.id_medicamento, (porMedicamento.get(l.id_medicamento) ?? 0) + l.cantidad_actual);
  }
  return medicamentos
    .filter((m) => (porMedicamento.get(m.id_medicamento) ?? 0) < m.stock_minimo)
    .map((m) => ({ medicamento: m, stock: porMedicamento.get(m.id_medicamento) ?? 0 }))
    .sort((a, b) => a.stock - a.medicamento.stock_minimo - (b.stock - b.medicamento.stock_minimo));
}

function nextId<T>(items: T[], idOf: (item: T) => number): number {
  return items.reduce((max, item) => Math.max(max, idOf(item)), 0) + 1;
}

function assertNumeroLoteUnico(lotes: Lote[], numeroLote: string, idMedicamento: number, ignoreId?: number) {
  const exists = lotes.some(
    (l) =>
      l.numero_lote.toLowerCase() === numeroLote.toLowerCase() &&
      l.id_medicamento === idMedicamento &&
      l.id_lote !== ignoreId
  );
  if (exists) {
    throw new ApiError(`Este medicamento ya tiene un lote con número "${numeroLote}".`, 409);
  }
}

function appendKardex(entry: Omit<KardexMovimiento, "id_movimiento">) {
  const kardex = readCollection<KardexMovimiento>(KARDEX_KEY, KARDEX_SEED);
  const nuevo: KardexMovimiento = { ...entry, id_movimiento: nextId(kardex, (k) => k.id_movimiento) };
  writeCollection(KARDEX_KEY, [...kardex, nuevo]);
}

export type LoteInput = {
  numero_lote: string;
  fecha_vencimiento: string;
  precio_compra: number;
  id_medicamento: number;
};

export async function createLote(
  input: LoteInput & { cantidad_actual: number },
  motivo = "Registro inicial de lote"
): Promise<Lote> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED);
  assertNumeroLoteUnico(lotes, input.numero_lote, input.id_medicamento);
  const nuevo: Lote = { ...input, id_lote: nextId(lotes, (l) => l.id_lote) };
  writeCollection(LOTES_KEY, [...lotes, nuevo]);
  appendKardex({
    id_lote: nuevo.id_lote,
    tipo: "entrada",
    cantidad: nuevo.cantidad_actual,
    saldo: nuevo.cantidad_actual,
    motivo,
    fecha: new Date().toISOString(),
  });
  return nuevo;
}

export async function updateLote(id: number, input: LoteInput): Promise<Lote> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED);
  const actual = lotes.find((l) => l.id_lote === id);
  if (!actual) {
    throw new ApiError("El lote ya no existe.", 404);
  }
  assertNumeroLoteUnico(lotes, input.numero_lote, input.id_medicamento, id);
  const actualizado: Lote = { ...actual, ...input };
  writeCollection(
    LOTES_KEY,
    lotes.map((l) => (l.id_lote === id ? actualizado : l))
  );
  return actualizado;
}

export async function darDeBajaLote(id: number, cantidad: number, motivo: string): Promise<Lote> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED);
  const actual = lotes.find((l) => l.id_lote === id);
  if (!actual) {
    throw new ApiError("El lote ya no existe.", 404);
  }
  if (cantidad <= 0 || cantidad > actual.cantidad_actual) {
    throw new ApiError(`La cantidad debe estar entre 1 y ${actual.cantidad_actual}.`, 400);
  }
  const saldo = actual.cantidad_actual - cantidad;
  const actualizado: Lote = { ...actual, cantidad_actual: saldo };
  writeCollection(
    LOTES_KEY,
    lotes.map((l) => (l.id_lote === id ? actualizado : l))
  );
  appendKardex({
    id_lote: id,
    tipo: "ajuste",
    cantidad: -cantidad,
    saldo,
    motivo,
    fecha: new Date().toISOString(),
  });
  return actualizado;
}

/** FEFO: el lote con vencimiento más próximo que tenga stock suficiente para cubrir la cantidad completa. */
export function seleccionarLoteFEFO(lotes: Lote[], id_medicamento: number, cantidad: number): Lote | null {
  const candidatos = lotes
    .filter((l) => l.id_medicamento === id_medicamento && l.cantidad_actual >= cantidad)
    .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
  return candidatos[0] ?? null;
}

/** Descuento de stock por una venta — igual mecánica que `darDeBajaLote` pero con tipo de kardex "salida". */
export async function venderDesdeLote(id: number, cantidad: number, motivo: string): Promise<Lote> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED);
  const actual = lotes.find((l) => l.id_lote === id);
  if (!actual) {
    throw new ApiError("El lote ya no existe.", 404);
  }
  if (cantidad <= 0 || cantidad > actual.cantidad_actual) {
    throw new ApiError(`Stock insuficiente en el lote ${actual.numero_lote}.`, 409);
  }
  const saldo = actual.cantidad_actual - cantidad;
  const actualizado: Lote = { ...actual, cantidad_actual: saldo };
  writeCollection(
    LOTES_KEY,
    lotes.map((l) => (l.id_lote === id ? actualizado : l))
  );
  appendKardex({
    id_lote: id,
    tipo: "salida",
    cantidad: -cantidad,
    saldo,
    motivo,
    fecha: new Date().toISOString(),
  });
  return actualizado;
}

/** Devuelve stock a un lote al anular una venta. */
export async function restaurarStockPorVenta(id: number, cantidad: number, motivo: string): Promise<Lote> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED);
  const actual = lotes.find((l) => l.id_lote === id);
  if (!actual) {
    throw new ApiError("El lote ya no existe.", 404);
  }
  const saldo = actual.cantidad_actual + cantidad;
  const actualizado: Lote = { ...actual, cantidad_actual: saldo };
  writeCollection(
    LOTES_KEY,
    lotes.map((l) => (l.id_lote === id ? actualizado : l))
  );
  appendKardex({
    id_lote: id,
    tipo: "entrada",
    cantidad,
    saldo,
    motivo,
    fecha: new Date().toISOString(),
  });
  return actualizado;
}

export async function deleteLote(id: number): Promise<void> {
  await delay();
  const lotes = readCollection<Lote>(LOTES_KEY, LOTES_SEED);
  const actual = lotes.find((l) => l.id_lote === id);
  if (actual && actual.cantidad_actual > 0) {
    throw new ApiError("No se puede eliminar: el lote todavía tiene stock. Da de baja el stock primero.", 409);
  }
  writeCollection(
    LOTES_KEY,
    lotes.filter((l) => l.id_lote !== id)
  );
}
