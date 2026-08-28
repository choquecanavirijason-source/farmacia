import { apiFetch, unwrapCollection, unwrapApiData } from "@/lib/api/http";
import type { Caja, MovimientoCaja, MovimientoCajaTipo } from "@/lib/types";

interface CajaApi {
  id: number;
  opened_at: string;
  opening_amount: string | number;
  closed_at: string | null;
  closing_amount: string | number | null;
  expected_closing_amount: string | number | null;
  status: "open" | "closed";
}

function toCaja(c: CajaApi): Caja {
  return {
    id_caja: c.id,
    fecha_apertura: c.opened_at,
    monto_apertura: Number(c.opening_amount),
    fecha_cierre: c.closed_at,
    monto_cierre: c.closing_amount === null ? null : Number(c.closing_amount),
    monto_esperado_cierre:
      c.expected_closing_amount === null
        ? null
        : Number(c.expected_closing_amount),
    estado: c.status === "open" ? "abierta" : "cerrada",
  };
}

interface MovimientoCajaApi {
  id: number;
  cash_register_id: number;
  type: "income" | "expense";
  amount: string | number;
  description: string;
  occurred_at: string;
}

function toMovimiento(m: MovimientoCajaApi): MovimientoCaja {
  return {
    id_movimiento: m.id,
    id_caja: m.cash_register_id,
    tipo: m.type === "income" ? "ingreso" : "egreso",
    monto: Number(m.amount),
    concepto: m.description,
    fecha: m.occurred_at,
  };
}

export async function fetchCajas(): Promise<Caja[]> {
  const response = await apiFetch<CajaApi[] | { data: CajaApi[] }>(
    "/cash-registers?per_page=100",
  );
  return unwrapCollection(response).map(toCaja);
}

export async function fetchCajaAbierta(): Promise<Caja | null> {
  const data = await fetchCajas();
  return data.find((item) => item.estado === "abierta") ?? null;
}

export async function fetchMovimientosByCaja(
  id_caja: number,
): Promise<MovimientoCaja[]> {
  const data = await apiFetch<MovimientoCajaApi[]>(
    `/cash-registers/${id_caja}/movements`,
  );
  return data.map(toMovimiento);
}

/** Total esperado en caja: apertura + ingresos - egresos. */
export function montoEsperado(
  caja: Caja,
  movimientos: MovimientoCaja[],
): number {
  return movimientos.reduce(
    (total, m) => total + (m.tipo === "ingreso" ? m.monto : -m.monto),
    caja.monto_apertura,
  );
}

export async function abrirCaja(monto_apertura: number): Promise<Caja> {
  const response = await apiFetch<CajaApi | { data: CajaApi }>(
    "/cash-registers",
    {
      method: "POST",
      body: JSON.stringify({ opening_amount: monto_apertura }),
    },
  );
  return toCaja(unwrapApiData(response));
}

export async function registrarMovimiento(
  id_caja: number,
  tipo: MovimientoCajaTipo,
  monto: number,
  concepto: string,
): Promise<MovimientoCaja> {
  const data = await apiFetch<MovimientoCajaApi>(
    `/cash-registers/${id_caja}/movements`,
    {
      method: "POST",
      body: JSON.stringify({
        type: tipo === "ingreso" ? "income" : "expense",
        amount: monto,
        description: concepto,
      }),
    },
  );
  return toMovimiento(data);
}

export interface CierreResultado {
  caja: Caja;
  esperado: number;
  diferencia: number;
}

export async function cerrarCaja(
  id_caja: number,
  monto_cierre: number,
): Promise<CierreResultado> {
  const data = await apiFetch<{
    caja: CajaApi;
    esperado: string | number;
    diferencia: string | number;
  }>(`/cash-registers/${id_caja}/close`, {
    method: "POST",
    body: JSON.stringify({ closing_amount: monto_cierre }),
  });
  return {
    caja: toCaja(data.caja),
    esperado: Number(data.esperado),
    diferencia: Number(data.diferencia),
  };
}
