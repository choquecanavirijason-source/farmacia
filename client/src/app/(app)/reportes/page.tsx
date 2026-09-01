"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Calendar,
  CalendarClock,
  Filter,
  Printer,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrintDialog } from "@/components/layout/print-dialog";
import { SimpleBarChart } from "@/components/ui/simple-bar-chart";
import {
  computeProximosAVencer,
  diasHasta,
  fetchKardexByMedicamento,
  fetchLotes,
  type KardexMovimientoConLote,
} from "@/lib/api/batches";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { fetchDashboardStats, type IDashboardStats } from "@/lib/api/dashboard";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import type { Lote, Medicamento } from "@/lib/types";

export interface StockBajoItem {
  medicamento: Medicamento;
  stock: number;
}

const TIPO_META: Record<string, { label: string; icon: typeof ArrowUpCircle; className: string }> = {
  entrada: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  in: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  salida: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  out: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
  adjustment: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
};

function getSevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getThirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [lotes, setLotes] = useState<Lote[] | null>(null);

  // Rango de fechas para reportes estadísticos de ventas
  const [preset, setPreset] = useState<string>("7dias");
  const [startDate, setStartDate] = useState<string>(getSevenDaysAgo());
  const [endDate, setEndDate] = useState<string>(getToday());

  const [ventanaDias, setVentanaDias] = useState("30");
  const [idMedicamentoKardex, setIdMedicamentoKardex] = useState("");
  const [printOpen, setPrintOpen] = useState<"ventas" | "stock-bajo" | "por-vencer" | "kardex" | "mas-vendidos" | null>(null);

  // Carga de catálogos y lotes
  useEffect(() => {
    Promise.all([
      fetchMedicamentos().catch(() => []),
      fetchLotes().catch(() => []),
    ]).then(([meds, lots]) => {
      setMedicamentos(meds);
      setLotes(lots);
    });
  }, []);

  // Carga de estadísticas filtradas por rango de fecha
  useEffect(() => {
    const controller = new AbortController();
    setLoadingStats(true);

    fetchDashboardStats(
      {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
      controller.signal
    )
      .then((st) => {
        setStats(st);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStats(false);
      });

    return () => controller.abort();
  }, [startDate, endDate]);

  function handlePresetChange(val: string | null) {
    if (!val) return;
    setPreset(val);
    if (val === "hoy") {
      const today = getToday();
      setStartDate(today);
      setEndDate(today);
    } else if (val === "7dias") {
      setStartDate(getSevenDaysAgo());
      setEndDate(getToday());
    } else if (val === "30dias") {
      setStartDate(getThirtyDaysAgo());
      setEndDate(getToday());
    } else if (val === "mes") {
      setStartDate(getMonthStart());
      setEndDate(getToday());
    }
  }

  const stockBajo = useMemo<StockBajoItem[] | null>(() => {
    if (!medicamentos) return null;
    return medicamentos
      .filter((m: any) => {
        const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
        return stock < Number(m.min_stock ?? m.stock_minimo ?? 0);
      })
      .map((m: any) => ({
        medicamento: m,
        stock: Number(m.total_stock ?? m.stock_actual ?? 0),
      }));
  }, [medicamentos]);

  const proximosAVencer = useMemo(() => {
    return lotes ? computeProximosAVencer(lotes, Number(ventanaDias)) : null;
  }, [lotes, ventanaDias]);

  const medicamentoById = useMemo(
    () => new Map((medicamentos ?? []).map((m) => [m.id_medicamento || m.id, m])),
    [medicamentos]
  );

  const medicamentoKardexSeleccionado = medicamentos?.find(
    (m) => (m.id_medicamento || m.id) === Number(idMedicamentoKardex)
  );

  const chartVentasData = useMemo(() => {
    if (!stats?.ventas_por_rango) return [];
    return stats.ventas_por_rango.map((d) => ({
      label: d.label,
      value: d.value,
    }));
  }, [stats]);

  const topProductosChartData = useMemo(() => {
    if (!stats?.top_productos) return [];
    return stats.top_productos.map((p) => ({
      label: p.name,
      value: Number(p.total_vendido),
    }));
  }, [stats]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Reportes Estadísticos</h1>
        <p className="text-sm text-muted-foreground">
          Apoyo a la toma de decisiones: análisis de ventas, rotación de productos, inventario, vencimientos y kardex.
        </p>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ventas">Tendencia de Ventas</TabsTrigger>
          <TabsTrigger value="mas-vendidos">Más Vendidos</TabsTrigger>
          <TabsTrigger value="stock-bajo">Stock Bajo</TabsTrigger>
          <TabsTrigger value="por-vencer">Próximos a Vencer</TabsTrigger>
          <TabsTrigger value="kardex">Kardex por Medicamento</TabsTrigger>
        </TabsList>

        {/* PESTAÑA: VENTAS */}
        <TabsContent value="ventas" className="flex flex-col gap-4">
          {/* Barra de Filtro de Fechas */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                <span className="font-medium">Periodo:</span>
              </div>

              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="7dias">Últimos 7 días</SelectItem>
                  <SelectItem value="30dias">Últimos 30 días</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Desde:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Hasta:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="h-8 w-36 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {stats && (
                <div className="text-xs text-muted-foreground">
                  Total periodo: <strong className="text-primary font-mono text-sm">{formatCurrency(stats.ventas_rango_total ?? 0)}</strong>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPrintOpen("ventas")}
                disabled={loadingStats || chartVentasData.length === 0}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir
              </Button>
            </div>
          </div>

          {loadingStats ? (
            <Skeleton className="h-64 w-full" />
          ) : chartVentasData.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <ShoppingBag className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">No hay registros de ventas en el periodo seleccionado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ingresos diarios por ventas activas (Bs.)
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {startDate ? formatDate(startDate) : ""} — {endDate ? formatDate(endDate) : ""}
                  </span>
                </div>
                <SimpleBarChart data={chartVentasData} formatValue={(v) => formatCurrency(v)} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PESTAÑA: MÁS VENDIDOS */}
        <TabsContent value="mas-vendidos" className="flex flex-col gap-4">
          {/* Barra de Filtro de Fechas para Top Productos */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                <span className="font-medium">Periodo de ventas:</span>
              </div>

              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="7dias">Últimos 7 días</SelectItem>
                  <SelectItem value="30dias">Últimos 30 días</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Desde:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Hasta:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="h-8 w-36 text-xs"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setPrintOpen("mas-vendidos")}
              disabled={loadingStats || !stats?.top_productos || stats.top_productos.length === 0}
            >
              <Printer className="size-4" aria-hidden />
              Imprimir Reporte
            </Button>
          </div>

          {loadingStats ? (
            <Skeleton className="h-64 w-full" />
          ) : !stats?.top_productos || stats.top_productos.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <TrendingUp className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">No se registraron ventas en el periodo seleccionado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Top 10 medicamentos por unidades vendidas
                    </p>
                    <span className="text-xs font-mono text-muted-foreground">
                      {startDate ? formatDate(startDate) : ""} — {endDate ? formatDate(endDate) : ""}
                    </span>
                  </div>
                  <SimpleBarChart data={topProductosChartData} />
                </CardContent>
              </Card>

              <TopProductosTable items={stats.top_productos} />
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA: STOCK BAJO */}
        <TabsContent value="stock-bajo" className="flex flex-col gap-4">
          {stockBajo === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stockBajo.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <BarChart3 className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Todos los medicamentos cuentan con stock suficiente por encima de su mínimo</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => setPrintOpen("stock-bajo")}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir Reporte
              </Button>
              <StockBajoTable items={stockBajo} />
            </>
          )}
        </TabsContent>

        {/* PESTAÑA: PRÓXIMOS A VENCER */}
        <TabsContent value="por-vencer" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-xs text-muted-foreground">Ventana de alerta:</span>
              <Select value={ventanaDias} onValueChange={(v) => setVentanaDias(v ?? "30")}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {proximosAVencer && proximosAVencer.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPrintOpen("por-vencer")}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir Reporte
              </Button>
            ) : null}
          </div>

          {proximosAVencer === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : proximosAVencer.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarClock className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Ningún lote vence dentro de esta ventana de tiempo ({ventanaDias} días)</p>
              </CardContent>
            </Card>
          ) : (
            <ProximosAVencerTable items={proximosAVencer} medicamentoById={medicamentoById} />
          )}
        </TabsContent>

        {/* PESTAÑA: KARDEX */}
        <TabsContent value="kardex" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 max-w-sm flex-1 flex-col gap-1">
              <Select value={idMedicamentoKardex} onValueChange={(v) => setIdMedicamentoKardex(v ?? "")}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Selecciona un medicamento para ver su kardex..." />
                </SelectTrigger>
                <SelectContent>
                  {(medicamentos ?? []).map((m: any) => (
                    <SelectItem key={m.id_medicamento || m.id} value={String(m.id_medicamento || m.id)}>
                      {m.nombre || m.name} ({m.codigo || m.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {idMedicamentoKardex ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPrintOpen("kardex")}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir Kardex
              </Button>
            ) : null}
          </div>

          {!idMedicamentoKardex ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="py-12 text-center text-xs text-muted-foreground">
                Selecciona un medicamento en el menú desplegable superior para consultar su historial de movimientos.
              </CardContent>
            </Card>
          ) : (
            <KardexTabla key={idMedicamentoKardex} idMedicamento={Number(idMedicamentoKardex)} />
          )}
        </TabsContent>
      </Tabs>

      {/* DIÁLOGOS DE IMPRESIÓN */}
      <PrintDialog
        open={printOpen === "ventas"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Reporte de Ventas — ${startDate ? formatDate(startDate) : ""} al ${endDate ? formatDate(endDate) : ""}`}
      >
        <div className="flex flex-col gap-4 p-4 text-xs">
          <div className="flex justify-between border-b pb-2">
            <span>Rango: <strong>{startDate} al {endDate}</strong></span>
            <span>Total Recaudado: <strong>{formatCurrency(stats?.ventas_rango_total ?? 0)}</strong></span>
          </div>
          <DataTable
            data={stats?.ventas_por_rango || []}
            columns={[
              { key: "label", header: "Fecha / Periodo", accessor: (d) => d.label },
              {
                key: "value",
                header: "Total Vendido (Bs)",
                accessor: (d) => d.value,
                className: "text-right font-mono",
                render: (_, d) => formatCurrency(d.value),
              },
            ]}
            emptyMessage="No hay datos de ventas en este periodo."
          />
        </div>
      </PrintDialog>

      <PrintDialog
        open={printOpen === "mas-vendidos"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Top Productos Más Vendidos — ${startDate ? formatDate(startDate) : ""} al ${endDate ? formatDate(endDate) : ""}`}
      >
        {stats?.top_productos ? <TopProductosTable items={stats.top_productos} /> : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "stock-bajo"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title="Reporte: Medicamentos con Stock Bajo"
      >
        {stockBajo ? <StockBajoTable items={stockBajo} /> : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "por-vencer"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Reporte: Lotes Próximos a Vencer (${ventanaDias} días)`}
      >
        {proximosAVencer ? (
          <ProximosAVencerTable items={proximosAVencer} medicamentoById={medicamentoById} />
        ) : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "kardex"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Kardex de Inventario — ${(medicamentoKardexSeleccionado as any)?.nombre || (medicamentoKardexSeleccionado as any)?.name || ""}`}
      >
        {idMedicamentoKardex ? <KardexTabla idMedicamento={Number(idMedicamentoKardex)} /> : null}
      </PrintDialog>
    </div>
  );
}

function TopProductosTable({ items }: { items: any[] }) {
  const columns: DataTableColumn<any>[] = [
    {
      key: "code",
      header: "Código",
      accessor: (i) => i.code || "-",
      className: "w-28 font-mono text-xs",
    },
    {
      key: "name",
      header: "Medicamento",
      accessor: (i) => i.name,
      className: "font-medium text-xs",
    },
    {
      key: "total_vendido",
      header: "Uds. Vendidas",
      accessor: (i) => Number(i.total_vendido),
      className: "w-32 text-right font-mono text-xs font-semibold",
    },
    {
      key: "total_recaudado",
      header: "Total Recaudado",
      accessor: (i) => Number(i.total_recaudado),
      className: "w-36 text-right font-mono text-xs font-bold text-primary",
      render: (_, i) => formatCurrency(Number(i.total_recaudado)),
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar producto..."
      emptyMessage="No se encontraron productos."
    />
  );
}

function StockBajoTable({ items }: { items: StockBajoItem[] }) {
  const columns: DataTableColumn<StockBajoItem>[] = [
    {
      key: "codigo",
      header: "Código",
      accessor: (i) => (i.medicamento as any).codigo || (i.medicamento as any).code,
      className: "w-28 font-mono text-xs",
    },
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (i) => i.medicamento.nombre || (i.medicamento as any).name,
      className: "font-medium text-xs",
    },
    {
      key: "stock",
      header: "Stock Actual",
      accessor: (i) => i.stock,
      className: "w-28 text-center font-mono text-xs",
      render: (_, i) => (
        <span className={i.stock === 0 ? "text-destructive font-bold" : "text-amber-600 font-semibold"}>
          {i.stock} uds
        </span>
      ),
    },
    {
      key: "stock_minimo",
      header: "Stock Mínimo",
      accessor: (i) => Number((i.medicamento as any).stock_minimo || (i.medicamento as any).min_stock || 0),
      className: "w-28 text-center font-mono text-xs text-muted-foreground",
      render: (_, i) => `${(i.medicamento as any).stock_minimo || (i.medicamento as any).min_stock || 0} uds`,
    },
    {
      key: "deficit",
      header: "Déficit",
      accessor: (i) => {
        const min = Number((i.medicamento as any).stock_minimo || (i.medicamento as any).min_stock || 0);
        return Math.max(0, min - i.stock);
      },
      className: "w-28 text-center",
      render: (_, i) => {
        const min = Number((i.medicamento as any).stock_minimo || (i.medicamento as any).min_stock || 0);
        const def = Math.max(0, min - i.stock);
        return <Badge variant="destructive">-{def} uds</Badge>;
      },
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar medicamento…"
      emptyMessage="No se encontraron medicamentos."
    />
  );
}

function ProximosAVencerTable({
  items,
  medicamentoById,
}: {
  items: Lote[];
  medicamentoById: Map<number, Medicamento>;
}) {
  const columns: DataTableColumn<Lote>[] = [
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (l) => {
        const m = medicamentoById.get(l.id_medicamento || (l as any).medicament_id);
        return m?.nombre || (m as any)?.name || `Medicamento #${l.id_medicamento || (l as any).medicament_id}`;
      },
      className: "font-medium text-xs",
    },
    {
      key: "numero_lote",
      header: "N° Lote",
      accessor: (l) => l.numero_lote || (l as any).batch_number,
      className: "w-32 font-mono text-xs",
    },
    {
      key: "fecha_vencimiento",
      header: "Vencimiento",
      accessor: (l) => l.fecha_vencimiento || (l as any).expiration_date,
      className: "w-32 text-xs",
      render: (_, l) => formatDate(l.fecha_vencimiento || (l as any).expiration_date),
    },
    {
      key: "dias",
      header: "Tiempo Restante",
      accessor: (l) => diasHasta(l.fecha_vencimiento || (l as any).expiration_date),
      className: "w-36 text-center",
      render: (_, l) => {
        const dias = diasHasta(l.fecha_vencimiento || (l as any).expiration_date);
        return (
          <Badge variant={dias <= 0 ? "destructive" : dias <= 30 ? "warning" : "secondary"}>
            {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : dias === 0 ? "Vence hoy" : `${dias} días`}
          </Badge>
        );
      },
    },
    {
      key: "cantidad_actual",
      header: "Stock Lote",
      accessor: (l) => Number(l.cantidad_actual ?? (l as any).current_quantity ?? 0),
      className: "w-28 text-right font-mono text-xs",
      render: (_, l) => `${l.cantidad_actual ?? (l as any).current_quantity ?? 0} uds`,
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar por medicamento o N° de lote…"
      emptyMessage="No se encontraron lotes."
    />
  );
}

function KardexTabla({ idMedicamento }: { idMedicamento: number }) {
  const [kardex, setKardex] = useState<KardexMovimientoConLote[] | null>(null);

  useEffect(() => {
    fetchKardexByMedicamento(idMedicamento).then(setKardex);
  }, [idMedicamento]);

  if (kardex === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (kardex.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-xs text-muted-foreground">
        Sin movimientos registrados para este medicamento.
      </div>
    );
  }

  const columns: DataTableColumn<any>[] = [
    {
      key: "tipo",
      header: "Tipo",
      accessor: (k: any) => TIPO_META[k.tipo || k.type]?.label || k.tipo || k.type,
      className: "w-28",
      render: (_, k: any) => {
        const meta = TIPO_META[k.tipo || k.type] || { label: k.tipo || k.type, icon: SlidersHorizontal, className: "text-muted-foreground" };
        const Icon = meta.icon;
        return (
          <span className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${meta.className}`}>
            <Icon className="size-3.5" aria-hidden />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "numero_lote",
      header: "N° Lote",
      accessor: (k: any) => k.numero_lote || k.batch_number || "—",
      className: "w-28 font-mono text-xs",
    },
    {
      key: "cantidad",
      header: "Cantidad",
      accessor: (k: any) => k.cantidad ?? k.quantity,
      className: "w-24 text-right font-mono text-xs",
      render: (_, k: any) => {
        const cant = Number(k.cantidad ?? k.quantity ?? 0);
        const isEntry = k.tipo === "in" || k.tipo === "entrada" || k.type === "in" || k.type === "entrada";
        return (
          <span className={isEntry ? "text-success font-semibold" : "text-destructive font-semibold"}>
            {isEntry ? "+" : "-"}{Math.abs(cant)}
          </span>
        );
      },
    },
    {
      key: "saldo",
      header: "Saldo Resultante",
      accessor: (k: any) => k.saldo ?? k.balance,
      className: "w-28 text-right font-mono text-xs font-bold",
      render: (_, k: any) => `${k.saldo ?? k.balance ?? 0} uds`,
    },
    {
      key: "motivo",
      header: "Motivo / Detalle",
      accessor: (k: any) => k.motivo || k.reason || "—",
      className: "text-xs",
      render: (_, k: any) => (
        <span className="text-muted-foreground">{k.motivo || k.reason || "—"}</span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha y Hora",
      accessor: (k: any) => k.fecha || k.fecha_hora || k.occurred_at || k.created_at || "",
      className: "w-36 text-xs text-muted-foreground",
      render: (_, k: any) => formatDateTime(k.fecha || k.fecha_hora || k.occurred_at || k.created_at),
    },
  ];

  return (
    <DataTable
      data={kardex}
      columns={columns}
      searchPlaceholder="Buscar por N° de lote o motivo…"
      emptyMessage="No se encontraron movimientos."
    />
  );
}
