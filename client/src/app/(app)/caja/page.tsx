"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import {
  fetchCajas,
  fetchCajaAbierta,
  fetchMovimientosByCaja,
  montoEsperado,
  type CierreResultado,
} from "@/lib/api/cash-registers";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency } from "@/lib/format";
import type { Caja, MovimientoCaja } from "@/lib/types";
import { OpenCashRegisterDialog } from "./open-cash-register-dialog";
import { CloseCashRegisterDialog } from "./close-cash-register-dialog";
import { CashMovementDialog } from "./cash-movement-dialog";

function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

export default function CajaPage() {
  const { can, user } = useAuth();
  const [cajaAbierta, setCajaAbierta] = useState<Caja | null | undefined>(undefined);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [historial, setHistorial] = useState<Caja[] | null>(null);

  const [abrirOpen, setAbrirOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<"ingreso" | "egreso" | null>(null);
  const [cerrarOpen, setCerrarOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchCajaAbierta(), fetchCajas()]).then(([abierta, cajas]) => {
      setCajaAbierta(abierta);
      setHistorial(cajas);
      if (abierta) {
        fetchMovimientosByCaja(abierta.id_caja).then(setMovimientos);
      }
    });
  }, []);

  function handleCajaAbierta(nueva: Caja) {
    setCajaAbierta(nueva);
    setMovimientos([]);
    setHistorial((prev) => (prev ? [nueva, ...prev] : [nueva]));
    toast.success("Caja abierta correctamente.");
  }

  function handleMovimientoCreado(mov: MovimientoCaja) {
    setMovimientos((prev) => [mov, ...prev]);
    toast.success(`${mov.tipo === "ingreso" ? "Ingreso" : "Egreso"} registrado.`);
  }

  function handleCajaCerrada(caja: Caja) {
    setCajaAbierta(null);
    setMovimientos([]);
    setHistorial((prev) =>
      prev ? prev.map((c) => (c.id_caja === caja.id_caja ? caja : c)) : null
    );
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
      header: "Concepto",
      accessor: (m: any) => m.concepto || m.concept,
      render: (_, m: any) => <span className="font-medium">{m.concepto || m.concept}</span>,
    },
    {
      key: "monto",
      header: "Monto",
      accessor: (m) => m.monto,
      className: "text-right",
      render: (_, m) => (
        <span
          className={`font-semibold font-mono ${
            m.tipo === "ingreso" ? "text-success" : "text-destructive"
          }`}
        >
          {m.tipo === "ingreso" ? "+" : "-"}
          {formatCurrency(m.monto)}
        </span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha",
      accessor: (m) => m.created_at,
      render: (_, m) => (
        <span className="text-muted-foreground">{formatFecha(m.created_at)}</span>
      ),
    },
  ];

  const historialColumns: DataTableColumn<Caja>[] = [
    {
      key: "id_caja",
      header: "ID",
      accessor: (c) => c.id_caja,
      className: "font-mono w-16",
    },
    {
      key: "fecha_apertura",
      header: "Apertura",
      accessor: (c) => c.fecha_apertura,
      render: (_, c) => formatFecha(c.fecha_apertura),
    },
    {
      key: "fecha_cierre",
      header: "Cierre",
      accessor: (c) => c.fecha_cierre,
      render: (_, c) => (c.fecha_cierre ? formatFecha(c.fecha_cierre) : "—"),
    },
    {
      key: "monto_apertura",
      header: "M. Apertura",
      accessor: (c) => c.monto_apertura,
      className: "text-right",
      render: (_, c) => formatCurrency(c.monto_apertura),
    },
    {
      key: "monto_cierre",
      header: "M. Cierre",
      accessor: (c) => c.monto_cierre,
      className: "text-right",
      render: (_, c) => (c.monto_cierre != null ? formatCurrency(c.monto_cierre) : "—"),
    },
    {
      key: "diferencia",
      header: "Diferencia",
      accessor: (c: any) => c.diferencia ?? (c.monto_cierre != null ? Number(c.monto_cierre) - Number(c.monto_apertura) : null),
      className: "text-right",
      render: (_, c: any) => {
        const dif = c.diferencia ?? (c.monto_cierre != null ? Number(c.monto_cierre) - Number(c.monto_apertura) : null);
        if (dif == null) return "—";
        const color =
          dif === 0 ? "text-muted-foreground" : dif > 0 ? "text-success" : "text-destructive";
        return <span className={`font-medium font-mono ${color}`}>{formatCurrency(dif)}</span>;
      },
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (c) => c.estado,
      render: (_, c) => (
        <Badge variant={c.estado === "abierta" ? "success" : "secondary"}>
          {c.estado === "abierta" ? "Abierta" : "Cerrada"}
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
                Abre la caja con el monto inicial en efectivo para empezar a registrar movimientos.
              </p>
            </div>
            {can(PERMISSIONS.OPEN_CASH_REGISTERS) && (
              <Button type="button" onClick={() => setAbrirOpen(true)} className="mt-2 gap-1.5">
                <Wallet className="size-4" aria-hidden />
                Abrir Caja
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="max-w-2xl border-primary/30 bg-primary/5">
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" aria-hidden />
                <CardTitle className="text-sm font-medium">Caja abierta</CardTitle>
                <Badge variant="success">Abierta</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
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
                  <p className="text-xs text-muted-foreground">Esperado ahora</p>
                  <p className="text-sm font-semibold">{formatCurrency(esperado)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {can(PERMISSIONS.CREATE_CASH_MOVEMENTS) && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setMovimientoTipo("ingreso")}
                    >
                      <ArrowUpCircle className="size-4" aria-hidden />
                      Registrar Ingreso
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setMovimientoTipo("egreso")}
                    >
                      <ArrowDownCircle className="size-4" aria-hidden />
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
            <p className="text-sm font-medium">Movimientos de esta caja</p>
            {movimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
            ) : (
              <DataTable
                data={movimientos}
                columns={movimientosColumns}
                searchPlaceholder="Buscar por concepto…"
                emptyMessage="No se encontraron movimientos."
              />
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Historial de cajas cerradas</p>
        {historial === null ? (
          <Skeleton className="h-24 w-full" />
        ) : historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no se cerró ninguna caja.</p>
        ) : (
          <DataTable
            data={historial}
            columns={historialColumns}
            searchPlaceholder="Buscar en el historial…"
            emptyMessage="No se encontraron cajas."
          />
        )}
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
