"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Lock, Wallet, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCajaAbierta,
  fetchMovimientosByCaja,
  getCashRegistersPaginated,
  exportCashRegisters,
  montoEsperado,
} from "@/lib/api/cash-registers";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency } from "@/lib/format";
import type { Caja, MovimientoCaja } from "@/lib/types";
import type { ICashRegister } from "@/lib/types/cash-register";
import { OpenCashRegisterDialog } from "./open-cash-register-dialog";
import { CloseCashRegisterDialog } from "./close-cash-register-dialog";
import { CashMovementDialog } from "./cash-movement-dialog";

function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "opening_date", direction: "desc" },
};

export default function CajaPage() {
  const { can, user } = useAuth();
  const [cajaAbierta, setCajaAbierta] = useState<Caja | null | undefined>(undefined);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);

  // Historial con paginación en servidor
  const [historyParams, setHistoryParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [historyItems, setHistoryItems] = useState<ICashRegister[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [abrirOpen, setAbrirOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<"ingreso" | "egreso" | null>(null);
  const [cerrarOpen, setCerrarOpen] = useState(false);

  // Carga inicial optimizada: solo la caja activa
  const refreshCajaActual = useCallback(() => {
    fetchCajaAbierta()
      .then((abierta) => {
        setCajaAbierta(abierta);
        if (abierta) {
          fetchMovimientosByCaja(abierta.id_caja).then(setMovimientos);
        } else {
          setMovimientos([]);
        }
      })
      .catch(() => {
        setCajaAbierta(null);
        setMovimientos([]);
      });
  }, []);

  useEffect(() => {
    refreshCajaActual();
  }, [refreshCajaActual]);

  const refreshHistory = useCallback(() => {
    setHistoryLoading(true);
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const historyParamsRef = useRef(historyParams);
  const handleHistoryParamsChange = useCallback((next: ServerFetchParams) => {
    const searchChanged = historyParamsRef.current.search !== next.search;
    historyParamsRef.current = next;
    if (!searchChanged) setHistoryLoading(true);
    setHistoryParams(next);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const filters: { status?: string } = {};
    if (statusFilter !== "all") filters.status = statusFilter;

    getCashRegistersPaginated(historyParams, controller.signal, filters)
      .then((result) => {
        setHistoryItems(result.data);
        setHistoryTotal(result.meta?.total ?? result.data.length);
        setHistoryError(null);
        if (result.data.length === 0 && result.meta?.total > 0 && historyParams.page > 1) {
          setHistoryParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        setHistoryError(err?.message || "Error al cargar el historial de cajas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });

    return () => controller.abort();
  }, [historyParams, historyRefreshKey, statusFilter]);

  function handleCajaAbierta(nueva: Caja) {
    setCajaAbierta(nueva);
    setMovimientos([]);
    refreshHistory();
    toast.success("Caja abierta correctamente.");
  }

  function handleMovimientoCreado(mov: MovimientoCaja) {
    setMovimientos((prev) => [mov, ...prev]);
    toast.success(`${mov.tipo === "ingreso" ? "Ingreso" : "Egreso"} registrado.`);
  }

  function handleCajaCerrada(_caja: Caja) {
    setCajaAbierta(null);
    setMovimientos([]);
    refreshHistory();
    toast.success("Caja cerrada correctamente.");
  }

  const esperado = useMemo(() => {
    if (!cajaAbierta) return 0;
    return montoEsperado(cajaAbierta.monto_apertura, movimientos);
  }, [cajaAbierta, movimientos]);

  const movimientosColumns: DataTableColumn<MovimientoCaja>[] = [
    {
      key: "tipo",
      header: "Tipo",
      accessor: (m) => m.tipo,
      render: (_, m) => (
        <Badge variant={m.tipo === "ingreso" ? "success" : "destructive"}>
          {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
        </Badge>
      ),
    },
    {
      key: "concepto",
      header: "Concepto / Motivo",
      accessor: (m: any) => m.concepto || m.concept,
      render: (_, m: any) => <span className="font-medium text-xs">{m.concepto || m.concept}</span>,
    },
    {
      key: "monto",
      header: "Monto",
      accessor: (m) => m.monto,
      className: "text-right",
      render: (_, m) => (
        <span
          className={`font-semibold font-mono text-xs ${
            m.tipo === "ingreso" ? "text-success" : "text-destructive"
          }`}
        >
          {m.tipo === "ingreso" ? "+" : "-"}
          {formatCurrency(m.monto)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Hora",
      accessor: (m) => m.created_at,
      render: (_, m) => (
        <span className="text-muted-foreground text-xs">{formatFecha(m.created_at)}</span>
      ),
    },
  ];

  const historialColumns: DataTableColumn<ICashRegister>[] = [
    {
      key: "id",
      header: "N° Caja",
      accessor: (c) => c.id,
      className: "font-mono w-20",
      render: (_, c) => <span className="font-mono text-xs font-semibold">#{c.id}</span>,
    },
    {
      key: "opening_date",
      header: "Apertura",
      accessor: (c) => c.opening_date,
      render: (_, c) => <span className="text-xs">{formatFecha(c.opening_date)}</span>,
    },
    {
      key: "closing_date",
      header: "Cierre",
      accessor: (c) => c.closing_date,
      render: (_, c) => (
        <span className="text-xs text-muted-foreground">
          {c.closing_date ? formatFecha(c.closing_date) : "— En curso —"}
        </span>
      ),
    },
    {
      key: "opening_amount",
      header: "M. Apertura",
      accessor: (c) => Number(c.opening_amount),
      className: "text-right",
      render: (_, c) => <span className="font-mono text-xs">{formatCurrency(Number(c.opening_amount))}</span>,
    },
    {
      key: "closing_amount",
      header: "M. Cierre",
      accessor: (c) => (c.closing_amount ? Number(c.closing_amount) : null),
      className: "text-right",
      render: (_, c) => (
        <span className="font-mono text-xs font-semibold">
          {c.closing_amount != null ? formatCurrency(Number(c.closing_amount)) : "—"}
        </span>
      ),
    },
    {
      key: "expected_closing_amount",
      header: "M. Esperado",
      accessor: (c) => (c.expected_closing_amount ? Number(c.expected_closing_amount) : null),
      className: "text-right",
      render: (_, c) => (
        <span className="font-mono text-xs text-muted-foreground">
          {c.expected_closing_amount != null ? formatCurrency(Number(c.expected_closing_amount)) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (c) => c.status,
      render: (_, c) => (
        <Badge variant={c.status === "open" || c.status === "abierta" ? "success" : "secondary"} className="text-[11px]">
          {c.status === "open" || c.status === "abierta" ? "Abierta" : "Cerrada"}
        </Badge>
      ),
    },
  ];

  const isLoading = cajaAbierta === undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Caja</h1>
        <p className="text-sm text-muted-foreground">Apertura, movimientos de efectivo y cierre con arqueo.</p>
      </div>

      {isLoading ? (
        <Card className="max-w-2xl">
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ) : !cajaAbierta ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">La caja está cerrada</p>
              <p className="max-w-sm text-xs text-balance text-muted-foreground">
                Abre la caja con el monto inicial en efectivo para empezar a registrar movimientos y ventas.
              </p>
            </div>
            {can(PERMISSIONS.OPEN_CASH_REGISTERS) && (
              <Button type="button" onClick={() => setAbrirOpen(true)} className="mt-2 gap-1.5 shadow-xs">
                <Wallet className="size-4" aria-hidden />
                Abrir Caja
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="max-w-2xl border-primary/30 bg-primary/5">
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" aria-hidden />
                <CardTitle className="text-sm font-semibold">Turno de Caja Activo</CardTitle>
                <Badge variant="success">Abierta</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Apertura</p>
                  <p className="text-sm font-medium">{formatFecha(cajaAbierta.fecha_apertura)}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Monto inicial</p>
                  <p className="text-sm font-medium">{formatCurrency(cajaAbierta.monto_apertura)}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Esperado en caja</p>
                  <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(esperado)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                {can(PERMISSIONS.CREATE_CASH_MOVEMENTS) && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setMovimientoTipo("ingreso")}
                    >
                      <ArrowUpCircle className="size-4 text-success" aria-hidden />
                      Registrar Ingreso
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setMovimientoTipo("egreso")}
                    >
                      <ArrowDownCircle className="size-4 text-destructive" aria-hidden />
                      Registrar Egreso
                    </Button>
                  </>
                )}
                {can(PERMISSIONS.CLOSE_CASH_REGISTERS) && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="ml-auto gap-1.5"
                    onClick={() => setCerrarOpen(true)}
                  >
                    <Lock className="size-4" aria-hidden />
                    Cerrar Caja
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Movimientos del Turno Actual</h2>
            {movimientos.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg">
                No hay ingresos ni egresos manuales registrados en este turno.
              </p>
            ) : (
              <DataTable
                data={movimientos}
                columns={movimientosColumns}
                searchPlaceholder="Buscar movimientos…"
                emptyMessage="No se encontraron movimientos."
              />
            )}
          </div>
        </>
      )}

      {/* Historial General de Cajas con Paginación y Filtros */}
      <div className="flex flex-col gap-3 pt-4 border-t">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Historial de Cajas</h2>
            <p className="text-xs text-muted-foreground">Registro histórico de aperturas y cierres de turno.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Estado:</span>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v || "all");
                setHistoryParams((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="h-8 min-w-36 w-auto text-xs px-3">
                <SelectValue>
                  {statusFilter === "open"
                    ? "Abiertas"
                    : statusFilter === "closed"
                    ? "Cerradas"
                    : "Todas las cajas"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-36">
                <SelectItem value="all">Todas las cajas</SelectItem>
                <SelectItem value="open">Abiertas</SelectItem>
                <SelectItem value="closed">Cerradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          data={historyItems}
          columns={historialColumns}
          server={{
            params: historyParams,
            onParamsChange: handleHistoryParamsChange,
            total: historyTotal,
            loading: historyLoading,
            error: historyError,
            onRetry: refreshHistory,
          }}
          searchPlaceholder="Buscar en el historial de cajas…"
          emptyMessage="No se encontraron cajas registradas."
          pageSizeOptions={[10, 20, 50]}
          exportFilename="historial_cajas.csv"
          onExport={
            can(PERMISSIONS.EXPORT_CASH_REGISTERS)
              ? (format) =>
                  exportCashRegisters(format, {
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    search: historyParams.search,
                    sort_by: historyParams.sort?.key,
                    sort_dir: historyParams.sort?.direction,
                  })
              : undefined
          }
          onRefresh={refreshHistory}
          getRowId={(c) => c.id}
          storageKey="cajas-history-table"
        />
      </div>

      <OpenCashRegisterDialog
        open={abrirOpen}
        onOpenChange={setAbrirOpen}
        idUsuario={user?.id || 1}
        onCajaAbierta={handleCajaAbierta}
      />

      {cajaAbierta && movimientoTipo ? (
        <CashMovementDialog
          open={Boolean(movimientoTipo)}
          onOpenChange={(open) => !open && setMovimientoTipo(null)}
          idCaja={cajaAbierta.id_caja}
          onMovimientoRegistrado={handleMovimientoCreado}
        />
      ) : null}

      <CloseCashRegisterDialog
        open={cerrarOpen}
        caja={cerrarOpen ? cajaAbierta ?? null : null}
        totalEsperado={esperado}
        onOpenChange={(open) => !open && setCerrarOpen(false)}
        onCajaCerrada={handleCajaCerrada}
      />
    </div>
  );
}
