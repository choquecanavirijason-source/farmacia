import { apiFetch } from "@/lib/api/http";
import type { Caja, MovimientoCaja, MovimientoCajaTipo } from "@/lib/types";

interface CajaApi extends Omit<Caja, "monto_apertura" | "monto_cierre" | "monto_esperado_cierre"> {
  monto_apertura: string;
  monto_cierre: string | null;
  monto_esperado_cierre: string | null;
}

function toCaja(c: CajaApi): Caja {
  return {
    ...c,
    monto_apertura: Number(c.monto_apertura),
    monto_cierre: c.monto_cierre === null ? null : Number(c.monto_cierre),
    monto_esperado_cierre: c.monto_esperado_cierre === null ? null : Number(c.monto_esperado_cierre),
  };
}

interface MovimientoCajaApi extends Omit<MovimientoCaja, "monto"> {
  monto: string;
}

function toMovimiento(m: MovimientoCajaApi): MovimientoCaja {
  return { ...m, monto: Number(m.monto) };
}

export async function fetchCajas(): Promise<Caja[]> {
  const data = await apiFetch<CajaApi[]>("/cajas");
  return data.map(toCaja);
}

export async function fetchCajaAbierta(): Promise<Caja | null> {
  const data = await apiFetch<CajaApi | null>("/cajas/abierta");
  return data ? toCaja(data) : null;
}

export async function fetchMovimientosByCaja(id_caja: number): Promise<MovimientoCaja[]> {
  const data = await apiFetch<MovimientoCajaApi[]>(`/cajas/${id_caja}/movimientos`);
  return data.map(toMovimiento);
}

/** Total esperado en caja: apertura + ingresos - egresos. */
export function montoEsperado(caja: Caja, movimientos: MovimientoCaja[]): number {
  return movimientos.reduce(
    (total, m) => total + (m.tipo === "ingreso" ? m.monto : -m.monto),
    caja.monto_apertura
  );
}

export async function abrirCaja(monto_apertura: number): Promise<Caja> {
  const data = await apiFetch<CajaApi>("/cajas", {
    method: "POST",
    body: JSON.stringify({ monto_apertura }),
  });
  return toCaja(data);
}

export async function registrarMovimiento(
  id_caja: number,
  tipo: MovimientoCajaTipo,
  monto: number,
  concepto: string
): Promise<MovimientoCaja> {
  const data = await apiFetch<MovimientoCajaApi>(`/cajas/${id_caja}/movimientos`, {
    method: "POST",
    body: JSON.stringify({ tipo, monto, concepto }),
  });
  return toMovimiento(data);
}

export interface CierreResultado {
  caja: Caja;
  esperado: number;
  diferencia: number;
}

export async function cerrarCaja(id_caja: number, monto_cierre: number): Promise<CierreResultado> {
  const data = await apiFetch<{ caja: CajaApi; esperado: number; diferencia: number }>(
    `/cajas/${id_caja}/cerrar`,
    { method: "POST", body: JSON.stringify({ monto_cierre }) }
  );
  return { caja: toCaja(data.caja), esperado: data.esperado, diferencia: data.diferencia };
}
