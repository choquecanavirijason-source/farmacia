"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchCajaAbierta,
  fetchCajas,
  fetchMovimientosByCaja,
  montoEsperado,
  type CierreResultado,
} from "@/lib/api/caja";
import { formatCurrency } from "@/lib/format";
import type { Caja, MovimientoCaja } from "@/lib/types";
import { AbrirCajaDialog } from "@/app/(app)/caja/abrir-caja-dialog";
import { MovimientoCajaDialog } from "@/app/(app)/caja/movimiento-caja-dialog";
import { CerrarCajaDialog } from "@/app/(app)/caja/cerrar-caja-dialog";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

export default function CajaPage() {
  const [cajaAbierta, setCajaAbierta] = useState<Caja | null | undefined>(undefined);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [historial, setHistorial] = useState<Caja[] | null>(null);

  const [abrirOpen, setAbrirOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<"ingreso" | "egreso" | null>(null);
  const [cerrarOpen, setCerrarOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchCajaAbierta(), fetchCajas()]).then(([abierta, cajas]) => {
      setCajaAbierta(abierta);
      setHistorial(cajas.filter((c) => c.estado === "cerrada").sort((a, b) => b.id_caja - a.id_caja));
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

  function handleClosed(resultado: CierreResultado) {
    setCajaAbierta(null);
    setMovimientos([]);
    setHistorial((prev) => (prev ? [resultado.caja, ...prev] : [resultado.caja]));
    toast.success(
      resultado.diferencia === 0
        ? "Caja cerrada. Cuadró exacto."
        : `Caja cerrada. Diferencia: ${formatCurrency(resultado.diferencia)}.`
    );
  }

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
            <Button type="button" onClick={() => setAbrirOpen(true)} className="mt-2 gap-1.5">
              <Wallet className="size-4" aria-hidden />
              Abrir Caja
            </Button>
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
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Movimientos de esta caja</p>
            {movimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((m) => (
                      <TableRow key={m.id_movimiento}>
                        <TableCell>
                          <Badge variant={m.tipo === "ingreso" ? "success" : "warning"}>
                            {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-56 truncate" title={m.concepto}>
                          {m.concepto}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {m.tipo === "ingreso" ? "+" : "-"}
                          {formatCurrency(m.monto)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatFecha(m.fecha)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Monto inicial</TableHead>
                  <TableHead>Monto contado</TableHead>
                  <TableHead>Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((c) => {
                  const diferencia = (c.monto_cierre ?? 0) - (c.monto_esperado_cierre ?? c.monto_apertura);
                  return (
                    <TableRow key={c.id_caja}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatFecha(c.fecha_apertura)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {c.fecha_cierre ? formatFecha(c.fecha_cierre) : "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(c.monto_apertura)}</TableCell>
                      <TableCell>{c.monto_cierre !== null ? formatCurrency(c.monto_cierre) : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={diferencia === 0 ? "secondary" : diferencia > 0 ? "warning" : "destructive"}>
                          {diferencia === 0 ? "Exacto" : formatCurrency(diferencia)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AbrirCajaDialog open={abrirOpen} onOpenChange={setAbrirOpen} onOpened={handleOpened} />

      {cajaAbierta && movimientoTipo ? (
        <MovimientoCajaDialog
          open={Boolean(movimientoTipo)}
          onOpenChange={(open) => !open && setMovimientoTipo(null)}
          idCaja={cajaAbierta.id_caja}
          tipoInicial={movimientoTipo}
          onRegistrado={handleMovimiento}
        />
      ) : null}

      <CerrarCajaDialog
        caja={cerrarOpen ? cajaAbierta ?? null : null}
        esperado={esperado}
        onOpenChange={(open) => !open && setCerrarOpen(false)}
        onClosed={handleClosed}
      />
    </div>
  );
}
