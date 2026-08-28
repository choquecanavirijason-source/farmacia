import { apiFetch, unwrapCollection } from "@/lib/api/http";
import type {
  KardexMovimiento,
  Lote,
  Medicamento,
  MotivoAjuste,
} from "@/lib/types";

/** Ventana de "próximo a vencer" usada en alertas y badges de la tabla. */
export const DIAS_ALERTA_VENCIMIENTO = 30;

interface LoteApi {
  id: number;
  batch_number: string;
  expiration_date: string;
  current_quantity: number;
  purchase_price: string | number;
  medicament_id: number;
}

function toLote(l: LoteApi): Lote {
  return {
    id_lote: l.id,
    numero_lote: l.batch_number,
    fecha_vencimiento: l.expiration_date.slice(0, 10),
    cantidad_actual: l.current_quantity,
    precio_compra: Number(l.purchase_price),
    id_medicamento: l.medicament_id,
  };
}

export async function fetchLotes(): Promise<Lote[]> {
  const response = await apiFetch<LoteApi[] | { data: LoteApi[] }>(
    "/batches?per_page=100",
  );
  return unwrapCollection(response).map(toLote);
}

interface KardexMovimientoApi {
  id: number;
  batch_id: number;
  type: "in" | "out" | "adjustment";
  quantity: number;
  balance: number;
  reason: string;
  occurred_at: string;
}

function toKardex(k: KardexMovimientoApi): KardexMovimiento {
  return {
    id_movimiento: k.id,
    id_lote: k.batch_id,
    tipo:
      k.type === "in" ? "entrada" : k.type === "out" ? "salida" : "ajuste",
    cantidad: k.quantity,
    saldo: k.balance,
    motivo: k.reason,
    fecha: k.occurred_at,
  };
}

export async function fetchKardexByLote(
  id_lote: number,
): Promise<KardexMovimiento[]> {
  const data = await apiFetch<KardexMovimientoApi[]>(
    `/batches/${id_lote}/kardex`,
  );
  return data.map(toKardex);
}

export interface KardexMovimientoConLote extends KardexMovimiento {
  numero_lote: string;
}

/** Kardex combinado de todos los lotes de un medicamento — usado en el reporte por medicamento. */
export async function fetchKardexByMedicamento(
  id_medicamento: number,
): Promise<KardexMovimientoConLote[]> {
  const data = await apiFetch<(KardexMovimientoApi & { batch_number: string })[]>(
    `/medicaments/${id_medicamento}/kardex`,
  );
  return data.map((k) => ({ ...toKardex(k), numero_lote: k.batch_number }));
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
export function computeProximosAVencer(
  lotes: Lote[],
  diasVentana = DIAS_ALERTA_VENCIMIENTO,
): Lote[] {
  return lotes
    .filter(
      (l) =>
        l.cantidad_actual > 0 && diasHasta(l.fecha_vencimiento) <= diasVentana,
    )
    .sort(
      (a, b) => diasHasta(a.fecha_vencimiento) - diasHasta(b.fecha_vencimiento),
    );
}

export interface StockBajoItem {
  medicamento: Medicamento;
  stock: number;
}

/** Medicamentos cuya suma de stock por lote no alcanza su stock mínimo configurado. */
export function computeStockBajo(
  medicamentos: Medicamento[],
  lotes: Lote[],
): StockBajoItem[] {
  const porMedicamento = new Map<number, number>();
  for (const l of lotes) {
    porMedicamento.set(
      l.id_medicamento,
      (porMedicamento.get(l.id_medicamento) ?? 0) + l.cantidad_actual,
    );
  }
  return medicamentos
    .filter((m) => (porMedicamento.get(m.id_medicamento) ?? 0) < m.stock_minimo)
    .map((m) => ({
      medicamento: m,
      stock: porMedicamento.get(m.id_medicamento) ?? 0,
    }))
    .sort(
      (a, b) =>
        a.stock -
        a.medicamento.stock_minimo -
        (b.stock - b.medicamento.stock_minimo),
    );
}

export type LoteInput = {
  numero_lote: string;
  fecha_vencimiento: string;
  precio_compra: number;
  id_medicamento: number;
};

export async function createLote(
  input: LoteInput & { cantidad_actual: number },
): Promise<Lote> {
  const response = await apiFetch<{ data: LoteApi }>("/batches", {
    method: "POST",
    body: JSON.stringify({
      batch_number: input.numero_lote,
      expiration_date: input.fecha_vencimiento,
      current_quantity: input.cantidad_actual,
      purchase_price: input.precio_compra,
      medicament_id: input.id_medicamento,
    }),
  });
  return toLote(response.data);
}

export async function updateLote(id: number, input: LoteInput): Promise<Lote> {
  const response = await apiFetch<{ data: LoteApi }>(`/batches/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      batch_number: input.numero_lote,
      expiration_date: input.fecha_vencimiento,
      purchase_price: input.precio_compra,
      medicament_id: input.id_medicamento,
    }),
  });
  return toLote(response.data);
}

export async function darDeBajaLote(
  id: number,
  cantidad: number,
  motivo: MotivoAjuste,
): Promise<Lote> {
  const data = await apiFetch<LoteApi>(`/batches/${id}/dispose`, {
    method: "POST",
    body: JSON.stringify({ cantidad, motivo }),
  });
  return toLote(data);
}

/** FEFO: el lote con vencimiento más próximo que tenga stock suficiente para cubrir la cantidad completa. */
export function seleccionarLoteFEFO(
  lotes: Lote[],
  id_medicamento: number,
  cantidad: number,
): Lote | null {
  const candidatos = lotes
    .filter(
      (l) =>
        l.id_medicamento === id_medicamento && l.cantidad_actual >= cantidad,
    )
    .sort(
      (a, b) =>
        new Date(a.fecha_vencimiento).getTime() -
        new Date(b.fecha_vencimiento).getTime(),
    );
  return candidatos[0] ?? null;
}

/** Descuento de stock por una venta. */
export async function venderDesdeLote(
  id: number,
  cantidad: number,
  motivo: string,
): Promise<Lote> {
  const data = await apiFetch<LoteApi>(`/batches/${id}/sell`, {
    method: "POST",
    body: JSON.stringify({ cantidad, motivo }),
  });
  return toLote(data);
}

/** Devuelve stock a un lote al anular una venta. */
export async function restaurarStockPorVenta(
  id: number,
  cantidad: number,
  motivo: string,
): Promise<Lote> {
  const data = await apiFetch<LoteApi>(`/batches/${id}/restore`, {
    method: "POST",
    body: JSON.stringify({ cantidad, motivo }),
  });
  return toLote(data);
}

export async function deleteLote(id: number): Promise<void> {
  await apiFetch<void>(`/batches/${id}`, { method: "DELETE" });
}
