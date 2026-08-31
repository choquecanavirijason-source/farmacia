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
import { formatCurrency } from "@/lib/format";
import type { Caja, MovimientoCaja } from "@/lib/types";
import { OpenCashRegisterDialog } from "./open-cash-register-dialog";
import { CloseCashRegisterDialog } from "./close-cash-register-dialog";
import { CashMovementDialog } from "./cash-movement-dialog";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

export default function CajaPage() {
  const { can } = useAuth();
  const [cajaAbierta, setCajaAbierta] = useState<Caja | null | undefined>(undefined);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [historial, setHistorial] = useState<Caja[] | null>(null);

  const [abrirOpen, setAbrirOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<"ingreso" | "egreso" | null>(null);
  const [cerrarOpen, setCerrarOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchCajaAbierta(), fetchCajas()]).then(([abierta, cajas]) => {
      setCajaAbierta(abierta);
      setHistorial(
        (cajas as any[])
          .filter((c: any) => c.estado === "cerrada" || c.status === "closed")
          .sort((a: any, b: any) => (b.id_caja || b.id) - (a.id_caja || a.id))
      );
      if (abierta) {
        fetchMovimientosByCaja(abierta.id_caja).then(setMovimientos);
      } else {
        setMovimientos([]);
      }
    });
  }, []);

  const esperado = useMemo(
    () => (cajaAbierta ? montoEsperado(cajaAbierta, movimientos) : 0),
    [cajaAbierta, movimientos]
  );

  function handleOpened(caja: Caja) {
    setCajaAbierta(caja);
    setMovimientos([]);
    toast.success("Caja abierta.");
  }

  function handleMovimiento(movimiento: MovimientoCaja) {
    setMovimientos((prev) => [movimiento, ...prev]);
    toast.success(movimiento.tipo === "ingreso" ? "Ingreso registrado." : "Egreso registrado.");
  }

  function handleClosed(caja: any) {
    setCajaAbierta(null);
    setMovimientos([]);
    setHistorial((prev) => (prev ? [caja, ...prev] : [caja]));
    toast.success("Caja cerrada correctamente.");
  }

  const isLoading = cajaAbierta === undefined;

  const movimientoColumns: DataTableColumn<any>[] = [
    {
      key: "tipo",
      header: "Tipo",
      accessor: (m: any) => m.tipo,
      render: (_, m: any) => (
        <Badge variant={m.tipo === "ingreso" ? "success" : "warning"}>
          {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
        </Badge>
      ),
    },
    {
      key: "concepto",
      header: "Concepto",
      accessor: (m: any) => m.concepto || m.concept,
      className: "max-w-56 truncate",
    },
    {
      key: "monto",
      header: "Monto",
      accessor: (m: any) => m.monto,
      className: "whitespace-nowrap text-right font-medium",
      render: (_, m: any) => `${m.tipo === "ingreso" ? "+" : "-"}${formatCurrency(m.monto)}`,
    },
    {
      key: "fecha",
      header: "Fecha",
      accessor: (m: any) => m.fecha || m.created_at,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, m: any) => formatFecha(m.fecha || m.created_at),
    },
  ];

  const historialColumns: DataTableColumn<any>[] = [
    {
      key: "fecha_apertura",
      header: "Apertura",
      accessor: (c: any) => c.fecha_apertura || c.opening_date,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, c: any) => formatFecha(c.fecha_apertura || c.opening_date),
    },
    {
      key: "fecha_cierre",
      header: "Cierre",
      accessor: (c: any) => c.fecha_cierre || c.closing_date,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, c: any) => (c.fecha_cierre || c.closing_date ? formatFecha(c.fecha_cierre || c.closing_date) : "—"),
    },
    {
      key: "monto_apertura",
      header: "Monto inicial",
      accessor: (c: any) => c.monto_apertura ?? c.opening_amount,
      className: "text-right",
      render: (_, c: any) => formatCurrency(Number(c.monto_apertura ?? c.opening_amount ?? 0)),
    },
    {
      key: "monto_cierre",
      header: "Monto contado",
      accessor: (c: any) => c.monto_cierre ?? c.closing_amount,
      className: "text-right",
      render: (_, c: any) => ((c.monto_cierre ?? c.closing_amount) !== null ? formatCurrency(Number(c.monto_cierre ?? c.closing_amount)) : "—"),
    },
    {
      key: "diferencia",
      header: "Diferencia",
      accessor: (c: any) => Number(c.monto_cierre ?? c.closing_amount ?? 0) - Number(c.monto_esperado ?? c.monto_esperado_cierre ?? c.monto_apertura ?? 0),
      className: "text-right",
      render: (_, c: any) => {
        const diferencia = Number(c.monto_cierre ?? c.closing_amount ?? 0) - Number(c.monto_esperado ?? c.monto_esperado_cierre ?? c.monto_apertura ?? 0);
        return (
          <Badge variant={diferencia === 0 ? "secondary" : diferencia > 0 ? "warning" : "destructive"}>
            {diferencia === 0 ? "Exacto" : formatCurrency(diferencia)}
          </Badge>
        );
      },
    },
  ];

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
            {can("open cash registers") && (
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
                {can("create cash movements") && (
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
                {can("close cash registers") && (
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
                columns={movimientoColumns}
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
        idUsuario={1}
        onCajaAbierta={handleOpened}
      />

      {cajaAbierta && movimientoTipo ? (
        <CashMovementDialog
          open={Boolean(movimientoTipo)}
          onOpenChange={(open) => !open && setMovimientoTipo(null)}
          idCaja={cajaAbierta.id_caja || cajaAbierta.id}
          onMovimientoRegistrado={handleMovimiento}
        />
      ) : null}

      <CloseCashRegisterDialog
        open={cerrarOpen}
        caja={cerrarOpen ? cajaAbierta ?? null : null}
        totalEsperado={esperado}
        onOpenChange={(open) => !open && setCerrarOpen(false)}
        onCajaCerrada={handleClosed}
      />
    </div>
  );
}
