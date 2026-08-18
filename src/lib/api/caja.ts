import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import type { Caja, MovimientoCaja, MovimientoCajaTipo } from "@/lib/types";

const CAJAS_KEY = "cajas";
const MOVIMIENTOS_KEY = "movimientos_caja";

const CAJAS_SEED: Caja[] = [];
const MOVIMIENTOS_SEED: MovimientoCaja[] = [];

function nextId<T>(items: T[], idOf: (item: T) => number): number {
  return items.reduce((max, item) => Math.max(max, idOf(item)), 0) + 1;
}

export async function fetchCajas(): Promise<Caja[]> {
  await delay();
  return readCollection<Caja>(CAJAS_KEY, CAJAS_SEED);
}

export async function fetchCajaAbierta(): Promise<Caja | null> {
  const cajas = await fetchCajas();
  return cajas.find((c) => c.estado === "abierta") ?? null;
}

export async function fetchMovimientosByCaja(id_caja: number): Promise<MovimientoCaja[]> {
  await delay();
  const movimientos = readCollection<MovimientoCaja>(MOVIMIENTOS_KEY, MOVIMIENTOS_SEED);
  return movimientos
    .filter((m) => m.id_caja === id_caja)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/** Total esperado en caja: apertura + ingresos - egresos (aún sin ventas, que llegan en una fase posterior). */
export function montoEsperado(caja: Caja, movimientos: MovimientoCaja[]): number {
  return movimientos.reduce(
    (total, m) => total + (m.tipo === "ingreso" ? m.monto : -m.monto),
    caja.monto_apertura
  );
}

export async function abrirCaja(monto_apertura: number): Promise<Caja> {
  await delay();
  if (!Number.isFinite(monto_apertura) || monto_apertura < 0) {
    throw new ApiError("El monto de apertura debe ser 0 o mayor.", 400);
  }
  const cajas = readCollection<Caja>(CAJAS_KEY, CAJAS_SEED);
  if (cajas.some((c) => c.estado === "abierta")) {
    throw new ApiError("Ya hay una caja abierta.", 409);
  }
  const nueva: Caja = {
    id_caja: nextId(cajas, (c) => c.id_caja),
    fecha_apertura: new Date().toISOString(),
    monto_apertura,
    fecha_cierre: null,
    monto_cierre: null,
    monto_esperado_cierre: null,
    estado: "abierta",
  };
  writeCollection(CAJAS_KEY, [...cajas, nueva]);
  return nueva;
}

export async function registrarMovimiento(
  id_caja: number,
  tipo: MovimientoCajaTipo,
  monto: number,
  concepto: string
): Promise<MovimientoCaja> {
  await delay();
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new ApiError("El monto debe ser mayor a 0.", 400);
  }
  if (!concepto.trim()) {
    throw new ApiError("El concepto es obligatorio.", 400);
  }
  const cajas = readCollection<Caja>(CAJAS_KEY, CAJAS_SEED);
  const caja = cajas.find((c) => c.id_caja === id_caja);
  if (!caja || caja.estado !== "abierta") {
    throw new ApiError("La caja no está abierta.", 409);
  }
  const movimientos = readCollection<MovimientoCaja>(MOVIMIENTOS_KEY, MOVIMIENTOS_SEED);
  const nuevo: MovimientoCaja = {
    id_movimiento: nextId(movimientos, (m) => m.id_movimiento),
    id_caja,
    tipo,
    monto,
    concepto: concepto.trim(),
    fecha: new Date().toISOString(),
  };
  writeCollection(MOVIMIENTOS_KEY, [...movimientos, nuevo]);
  return nuevo;
}

export interface CierreResultado {
  caja: Caja;
  esperado: number;
  diferencia: number;
}

export async function cerrarCaja(id_caja: number, monto_cierre: number): Promise<CierreResultado> {
  await delay();
  if (!Number.isFinite(monto_cierre) || monto_cierre < 0) {
    throw new ApiError("El monto contado debe ser 0 o mayor.", 400);
  }
  const cajas = readCollection<Caja>(CAJAS_KEY, CAJAS_SEED);
  const caja = cajas.find((c) => c.id_caja === id_caja);
  if (!caja || caja.estado !== "abierta") {
    throw new ApiError("La caja no está abierta.", 409);
  }
  const movimientos = readCollection<MovimientoCaja>(MOVIMIENTOS_KEY, MOVIMIENTOS_SEED);
  const deEstaCaja = movimientos.filter((m) => m.id_caja === id_caja);
  const esperado = montoEsperado(caja, deEstaCaja);

  const actualizada: Caja = {
    ...caja,
    fecha_cierre: new Date().toISOString(),
    monto_cierre,
    monto_esperado_cierre: esperado,
    estado: "cerrada",
  };
  writeCollection(
    CAJAS_KEY,
    cajas.map((c) => (c.id_caja === id_caja ? actualizada : c))
  );

  return { caja: actualizada, esperado, diferencia: monto_cierre - esperado };
}
