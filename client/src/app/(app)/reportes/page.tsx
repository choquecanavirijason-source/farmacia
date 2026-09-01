"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  BarChart3,
  Boxes,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  DollarSign,
  Filter,
  Flame,
  Package,
  Pill,
  Printer,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  diasHasta,
  fetchBatches,
  fetchKardexByMedicamento,
  type KardexMovimientoConLote,
} from "@/lib/api/batches";
import { fetchMedicaments } from "@/lib/api/medicaments";
import { fetchDashboardStats, type IDashboardStats } from "@/lib/api/dashboard";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";

export interface StockBajoItem {
  medicamento: any;
  stock: number;
  minStock: number;
  deficit: number;
  status: "agotado" | "critico" | "bajo" | "optimo";
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
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [medicamentos, setMedicamentos] = useState<any[] | null>(null);
  const [lotes, setLotes] = useState<any[] | null>(null);

  // Estados temporales del formulario de filtros de fechas
  const [tempPreset, setTempPreset] = useState<string>("7dias");
  const [tempStartDate, setTempStartDate] = useState<string>(getSevenDaysAgo());
  const [tempEndDate, setTempEndDate] = useState<string>(getToday());

  // Estados de filtros APLICADOS para ventas
  const [appliedStartDate, setAppliedStartDate] = useState<string>(getSevenDaysAgo());
  const [appliedEndDate, setAppliedEndDate] = useState<string>(getToday());

  // Filtros de las otras pestañas
  const [stockFiltroVista, setStockFiltroVista] = useState<"todos" | "bajos" | "agotados">("todos");
  const [ventanaDias, setVentanaDias] = useState("90");
  const [idMedicamentoKardex, setIdMedicamentoKardex] = useState("");
  const [printOpen, setPrintOpen] = useState<string | null>(null);

  // Carga inicial y forzada de catálogos y lotes
  function loadCatalogs() {
    setLoadingCatalogs(true);
    Promise.all([
      fetchMedicaments(true).catch(() => []),
      fetchBatches(true).catch(() => []),
    ])
      .then(([meds, lots]) => {
        setMedicamentos(meds);
        setLotes(lots);
        if (meds.length > 0 && !idMedicamentoKardex) {
          setIdMedicamentoKardex(String(meds[0].id));
        }
      })
      .finally(() => setLoadingCatalogs(false));
  }

  useEffect(() => {
    loadCatalogs();
  }, []);

  // Carga de estadísticas al aplicar filtros de fecha
  useEffect(() => {
    const controller = new AbortController();
    setLoadingStats(true);

    fetchDashboardStats(
      {
        start_date: appliedStartDate || undefined,
        end_date: appliedEndDate || undefined,
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
  }, [appliedStartDate, appliedEndDate]);

  function handlePresetChange(val: string | null) {
    if (!val) return;
    setTempPreset(val);
    if (val === "hoy") {
      const today = getToday();
      setTempStartDate(today);
      setTempEndDate(today);
    } else if (val === "7dias") {
      setTempStartDate(getSevenDaysAgo());
      setTempEndDate(getToday());
    } else if (val === "30dias") {
      setTempStartDate(getThirtyDaysAgo());
      setTempEndDate(getToday());
    } else if (val === "mes") {
      setTempStartDate(getMonthStart());
      setTempEndDate(getToday());
    }
  }

  function handleApplyFilters() {
    setAppliedStartDate(tempStartDate);
    setAppliedEndDate(tempEndDate);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleApplyFilters();
    }
  }

  // Análisis de Stock de todos los medicamentos
  const stockAnalisis = useMemo<StockBajoItem[] | null>(() => {
    if (!medicamentos) return null;

    const stockMap = new Map<number, number>();
    if (lotes && lotes.length > 0) {
      for (const l of lotes) {
        const mId = l.medicament_id || l.id_medicamento;
        const currentQty = Number(l.current_quantity ?? l.cantidad_actual ?? 0);
        stockMap.set(mId, (stockMap.get(mId) ?? 0) + currentQty);
      }
    }

    return medicamentos.map((m: any) => {
      const mId = m.id || m.id_medicamento;
      const stock = stockMap.has(mId)
        ? (stockMap.get(mId) ?? 0)
        : Number(m.total_stock ?? m.stock_actual ?? 0);

      const minStock = Number(m.min_stock ?? m.stock_minimo ?? 0);
      const deficit = Math.max(0, minStock - stock);

      let status: "agotado" | "critico" | "bajo" | "optimo" = "optimo";
      if (stock === 0) {
        status = "agotado";
      } else if (stock <= Math.floor(minStock / 2)) {
        status = "critico";
      } else if (stock < minStock) {
        status = "bajo";
      }

      return {
        medicamento: m,
        stock,
        minStock,
        deficit,
        status,
      };
    });
  }, [medicamentos, lotes]);

  const stockFiltrado = useMemo(() => {
    if (!stockAnalisis) return null;
    if (stockFiltroVista === "bajos") {
      return stockAnalisis.filter((i) => i.status === "bajo" || i.status === "critico" || i.status === "agotado");
    }
    if (stockFiltroVista === "agotados") {
      return stockAnalisis.filter((i) => i.status === "agotado");
    }
    return stockAnalisis;
  }, [stockAnalisis, stockFiltroVista]);

  const lotesAnalisis = useMemo(() => {
    if (!lotes) return null;
    const diasLimite = ventanaDias === "all" ? 99999 : Number(ventanaDias);

    return lotes
      .filter((l: any) => {
        const dias = diasHasta(l.expiration_date || l.fecha_vencimiento);
        if (ventanaDias === "all") return true;
        return dias <= diasLimite;
      })
      .sort((a: any, b: any) => {
        const dA = diasHasta(a.expiration_date || a.fecha_vencimiento);
        const dB = diasHasta(b.expiration_date || b.fecha_vencimiento);
        return dA - dB;
      });
  }, [lotes, ventanaDias]);

  const medicamentoById = useMemo(
    () => new Map((medicamentos ?? []).map((m) => [m.id || m.id_medicamento, m])),
    [medicamentos]
  );

  const medicamentoKardexSeleccionado = medicamentos?.find(
    (m) => (m.id || m.id_medicamento) === Number(idMedicamentoKardex)
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

  const totalUnidadesTop = useMemo(() => {
    if (!stats?.top_productos) return 0;
    return stats.top_productos.reduce((acc, p) => acc + Number(p.total_vendido || 0), 0);
  }, [stats]);

  const totalRecaudadoTop = useMemo(() => {
    if (!stats?.top_productos) return 0;
    return stats.top_productos.reduce((acc, p) => acc + Number(p.total_recaudado || 0), 0);
  }, [stats]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Reportes Estadísticos</h1>
          <p className="text-sm text-muted-foreground">
            Apoyo a la toma de decisiones: análisis de ventas, rotación de productos, inventario, vencimientos y kardex.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadCatalogs}
          disabled={loadingCatalogs}
          className="gap-1.5 text-xs w-fit"
        >
          <RefreshCw className={`size-3.5 ${loadingCatalogs ? "animate-spin" : ""}`} />
          Recargar Datos
        </Button>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ventas">Tendencia de Ventas</TabsTrigger>
          <TabsTrigger value="mas-vendidos">
            Más Vendidos (Top)
            {stats?.top_productos && stats.top_productos.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {stats.top_productos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock-bajo">
            Estado de Inventario / Stock
            {stockAnalisis && stockAnalisis.filter((i) => i.deficit > 0).length > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {stockAnalisis.filter((i) => i.deficit > 0).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="por-vencer">
            Próximos a Vencer
            {lotes && lotes.filter((l) => diasHasta(l.expiration_date || l.fecha_vencimiento) <= 90).length > 0 && (
              <Badge variant="warning" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {lotes.filter((l) => diasHasta(l.expiration_date || l.fecha_vencimiento) <= 90).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kardex">Kardex por Medicamento</TabsTrigger>
        </TabsList>

        {/* PESTAÑA: VENTAS */}
        <TabsContent value="ventas" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                <span className="font-medium">Periodo:</span>
              </div>

              <Select value={tempPreset} onValueChange={handlePresetChange}>
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
                  value={tempStartDate}
                  onChange={(e) => {
                    setTempStartDate(e.target.value);
                    setTempPreset("custom");
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Hasta:</span>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => {
                    setTempEndDate(e.target.value);
                    setTempPreset("custom");
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={handleApplyFilters}
                disabled={loadingStats}
              >
                <Check className="size-3.5" />
                Aplicar Filtros
              </Button>
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
                    {appliedStartDate ? formatDate(appliedStartDate) : ""} — {appliedEndDate ? formatDate(appliedEndDate) : ""}
                  </span>
                </div>
                <SimpleBarChart data={chartVentasData} formatValue={(v) => formatCurrency(v)} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PESTAÑA: MÁS VENDIDOS */}
        <TabsContent value="mas-vendidos" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                <span className="font-medium">Periodo de ventas:</span>
              </div>

              <Select value={tempPreset} onValueChange={handlePresetChange}>
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
                  value={tempStartDate}
                  onChange={(e) => {
                    setTempStartDate(e.target.value);
                    setTempPreset("custom");
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Hasta:</span>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => {
                    setTempEndDate(e.target.value);
                    setTempPreset("custom");
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={handleApplyFilters}
                disabled={loadingStats}
              >
                <Check className="size-3.5" />
                Aplicar Filtros
              </Button>
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
                <p className="text-xs text-muted-foreground">
                  Prueba ampliando el rango de fechas en la barra superior o ejecutando una simulación.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Tarjetas de Métricas Rápidas del Top */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border bg-card flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Trophy className="size-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-muted-foreground">Producto Más Vendido (#1)</span>
                    <strong className="text-sm font-bold truncate">
                      {stats.top_productos[0]?.name}
                    </strong>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {stats.top_productos[0]?.total_vendido} unidades ({formatCurrency(Number(stats.top_productos[0]?.total_recaudado))})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border bg-card flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Package className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Total Unidades Top 10</span>
                    <strong className="text-base font-bold font-mono text-foreground">
                      {totalUnidadesTop} uds
                    </strong>
                    <span className="text-[10px] text-muted-foreground">Volumen en el periodo</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border bg-card flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Total Recaudado Top 10</span>
                    <strong className="text-base font-bold font-mono text-emerald-600">
                      {formatCurrency(totalRecaudadoTop)}
                    </strong>
                    <span className="text-[10px] text-muted-foreground">Ingreso por productos líderes</span>
                  </div>
                </div>
              </div>

              {/* Gráfica de Barras */}
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-amber-500" />
                      <p className="text-sm font-semibold">
                        Top 10 medicamentos por unidades vendidas
                      </p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {appliedStartDate ? formatDate(appliedStartDate) : ""} — {appliedEndDate ? formatDate(appliedEndDate) : ""}
                    </span>
                  </div>
                  <SimpleBarChart data={topProductosChartData} />
                </CardContent>
              </Card>

              {/* Tabla Detallada con Ranking */}
              <TopProductosTable items={stats.top_productos} totalUnidades={totalUnidadesTop} />
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA: STOCK BAJO / ESTADO DE INVENTARIO */}
        <TabsContent value="stock-bajo" className="flex flex-col gap-4">
          {stockAnalisis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">Medicamentos Evaluados</span>
                <strong className="text-base font-bold font-mono">{stockAnalisis.length}</strong>
              </div>
              <div className="p-3 rounded-lg border bg-card flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">Stock Total en Unidades</span>
                <strong className="text-base font-bold font-mono text-primary">
                  {stockAnalisis.reduce((acc, i) => acc + i.stock, 0)} uds
                </strong>
              </div>
              <div className="p-3 rounded-lg border bg-card flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">Bajo Stock Mínimo</span>
                <strong className="text-base font-bold font-mono text-amber-600">
                  {stockAnalisis.filter((i) => i.status === "bajo" || i.status === "critico").length}
                </strong>
              </div>
              <div className="p-3 rounded-lg border bg-card flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">Agotados (0 Stock)</span>
                <strong className="text-base font-bold font-mono text-destructive">
                  {stockAnalisis.filter((i) => i.status === "agotado").length}
                </strong>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filtrar vista:</span>
              <div className="flex items-center rounded-lg border bg-muted/20 p-0.5">
                <Button
                  type="button"
                  size="xs"
                  variant={stockFiltroVista === "todos" ? "default" : "ghost"}
                  onClick={() => setStockFiltroVista("todos")}
                  className="text-xs h-7"
                >
                  Todos ({stockAnalisis?.length ?? 0})
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={stockFiltroVista === "bajos" ? "default" : "ghost"}
                  onClick={() => setStockFiltroVista("bajos")}
                  className="text-xs h-7 gap-1"
                >
                  Stock Bajo / Crítico ({stockAnalisis?.filter((i) => i.deficit > 0).length ?? 0})
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={stockFiltroVista === "agotados" ? "default" : "ghost"}
                  onClick={() => setStockFiltroVista("agotados")}
                  className="text-xs h-7"
                >
                  Agotados ({stockAnalisis?.filter((i) => i.stock === 0).length ?? 0})
                </Button>
              </div>
            </div>

            {stockFiltrado && stockFiltrado.length > 0 && (
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
            )}
          </div>

          {loadingCatalogs || stockFiltrado === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stockFiltrado.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CheckCircle2 className="size-6 text-success" aria-hidden />
                <p className="text-sm font-medium">No se encontraron medicamentos en esta categoría de filtro</p>
              </CardContent>
            </Card>
          ) : (
            <StockBajoTable items={stockFiltrado} />
          )}
        </TabsContent>

        {/* PESTAÑA: PRÓXIMOS A VENCER */}
        <TabsContent value="por-vencer" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-xs text-muted-foreground font-medium">Ventana de vencimiento:</span>
              <Select value={ventanaDias} onValueChange={(v) => setVentanaDias(v ?? "90")}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Próximos 15 días</SelectItem>
                  <SelectItem value="30">Próximos 30 días</SelectItem>
                  <SelectItem value="60">Próximos 60 días</SelectItem>
                  <SelectItem value="90">Próximos 90 días (3 meses)</SelectItem>
                  <SelectItem value="180">Próximos 180 días (6 meses)</SelectItem>
                  <SelectItem value="365">Próximo 1 año</SelectItem>
                  <SelectItem value="all">Todos los lotes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {lotesAnalisis && lotesAnalisis.length > 0 ? (
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

          {loadingCatalogs || lotesAnalisis === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : lotesAnalisis.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CheckCircle2 className="size-6 text-success" aria-hidden />
                <p className="text-sm font-medium">Ningún lote vence dentro de esta ventana de tiempo ({ventanaDias} días)</p>
              </CardContent>
            </Card>
          ) : (
            <ProximosAVencerTable items={lotesAnalisis} medicamentoById={medicamentoById} />
          )}
        </TabsContent>

        {/* PESTAÑA: KARDEX */}
        <TabsContent value="kardex" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 max-w-md flex-1 items-center gap-2">
              <Pill className="size-4 text-primary shrink-0" />
              <Select
                value={idMedicamentoKardex}
                onValueChange={(v) => setIdMedicamentoKardex(v ?? "")}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Selecciona un medicamento para ver su kardex..." />
                </SelectTrigger>
                <SelectContent>
                  {(medicamentos ?? []).map((m: any) => (
                    <SelectItem key={m.id || m.id_medicamento} value={String(m.id || m.id_medicamento)}>
                      {m.name || m.nombre} ({m.code || m.codigo})
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
        title={`Reporte de Ventas — ${appliedStartDate ? formatDate(appliedStartDate) : ""} al ${appliedEndDate ? formatDate(appliedEndDate) : ""}`}
      >
        <div className="flex flex-col gap-4 p-4 text-xs">
          <div className="flex justify-between border-b pb-2">
            <span>Rango: <strong>{appliedStartDate} al {appliedEndDate}</strong></span>
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
        title={`Top Productos Más Vendidos — ${appliedStartDate ? formatDate(appliedStartDate) : ""} al ${appliedEndDate ? formatDate(appliedEndDate) : ""}`}
      >
        {stats?.top_productos ? (
          <TopProductosTable items={stats.top_productos} totalUnidades={totalUnidadesTop} />
        ) : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "stock-bajo"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title="Reporte: Estado de Inventario y Stock"
      >
        {stockFiltrado ? <StockBajoTable items={stockFiltrado} /> : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "por-vencer"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Reporte: Lotes Próximos a Vencer (${ventanaDias === "all" ? "Todos" : ventanaDias + " días"})`}
      >
        {lotesAnalisis ? (
          <ProximosAVencerTable items={lotesAnalisis} medicamentoById={medicamentoById} />
        ) : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "kardex"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Kardex de Inventario — ${medicamentoKardexSeleccionado?.name || medicamentoKardexSeleccionado?.nombre || ""}`}
      >
        {idMedicamentoKardex ? <KardexTabla idMedicamento={Number(idMedicamentoKardex)} /> : null}
      </PrintDialog>
    </div>
  );
}

function TopProductosTable({
  items,
  totalUnidades = 0,
}: {
  items: any[];
  totalUnidades?: number;
}) {
  const rankedItems = useMemo(
    () => items.map((it, idx) => ({ ...it, rank: idx + 1 })),
    [items]
  );

  const columns: DataTableColumn<any>[] = [
    {
      key: "rank",
      header: "# Ranking",
      accessor: (i) => i.rank,
      resizable: true,
      width: 100,
      render: (val) => {
        const r = Number(val);
        if (r === 1) return <Badge className="bg-amber-500 text-white font-bold text-[10px]">🥇 #1</Badge>;
        if (r === 2) return <Badge className="bg-slate-400 text-white font-bold text-[10px]">🥈 #2</Badge>;
        if (r === 3) return <Badge className="bg-amber-700 text-white font-bold text-[10px]">🥉 #3</Badge>;
        return <span className="font-mono text-muted-foreground font-semibold">#{r}</span>;
      },
    },
    {
      key: "code",
      header: "Código",
      accessor: (i) => i.code || "-",
      resizable: true,
      width: 120,
      render: (val) => <span className="font-mono text-xs">{String(val)}</span>,
    },
    {
      key: "name",
      header: "Medicamento",
      accessor: (i) => i.name,
      resizable: true,
      width: 220,
      render: (val) => <span className="font-semibold text-xs">{String(val)}</span>,
    },
    {
      key: "total_vendido",
      header: "Uds. Vendidas",
      accessor: (i) => Number(i.total_vendido),
      resizable: true,
      width: 130,
      render: (_, i) => <span className="font-mono text-xs font-semibold">{i.total_vendido} uds</span>,
    },
    {
      key: "porcentaje",
      header: "% del Top",
      accessor: (i) => totalUnidades > 0 ? (Number(i.total_vendido) / totalUnidades) * 100 : 0,
      resizable: true,
      width: 110,
      render: (_, i) => {
        const pct = totalUnidades > 0 ? Math.round((Number(i.total_vendido) / totalUnidades) * 100) : 0;
        return (
          <div className="flex items-center gap-1.5 justify-center">
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px]">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "total_recaudado",
      header: "Total Recaudado",
      accessor: (i) => Number(i.total_recaudado),
      resizable: true,
      width: 150,
      render: (_, i) => <span className="font-mono text-xs font-bold text-primary">{formatCurrency(Number(i.total_recaudado))}</span>,
    },
  ];

  return (
    <DataTable
      data={rankedItems}
      columns={columns}
      searchPlaceholder="Buscar producto..."
      emptyMessage="No se encontraron productos."
      enableColumnDrag={true}
      persistPreferences={true}
      storageKey="reporte-mas-vendidos-table"
      minColumnWidth={80}
      pageSizeOptions={[10, 20, 50]}
    />
  );
}

function StockBajoTable({ items }: { items: StockBajoItem[] }) {
  const columns: DataTableColumn<StockBajoItem>[] = [
    {
      key: "codigo",
      header: "Código",
      accessor: (i) => i.medicamento.code || i.medicamento.codigo || "-",
      resizable: true,
      width: 110,
      render: (val) => <span className="font-mono text-xs">{String(val)}</span>,
    },
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (i) => i.medicamento.name || i.medicamento.nombre,
      resizable: true,
      width: 240,
      render: (val) => <span className="font-medium text-xs">{String(val)}</span>,
    },
    {
      key: "stock",
      header: "Stock Actual",
      accessor: (i) => i.stock,
      resizable: true,
      width: 130,
      render: (_, i) => (
        <span
          className={
            i.stock === 0
              ? "text-destructive font-bold text-xs font-mono"
              : i.status === "critico"
              ? "text-amber-600 font-bold text-xs font-mono"
              : "text-foreground text-xs font-mono"
          }
        >
          {i.stock} uds
        </span>
      ),
    },
    {
      key: "minStock",
      header: "Stock Mínimo",
      accessor: (i) => i.minStock,
      resizable: true,
      width: 130,
      render: (_, i) => <span className="font-mono text-xs text-muted-foreground">{i.minStock} uds</span>,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (i) => i.status,
      resizable: true,
      width: 140,
      render: (_, i) => {
        if (i.status === "agotado") return <Badge variant="destructive">Agotado</Badge>;
        if (i.status === "critico") return <Badge variant="destructive">Crítico (-{i.deficit})</Badge>;
        if (i.status === "bajo") return <Badge variant="warning">Bajo (-{i.deficit})</Badge>;
        return <Badge variant="secondary" className="text-success border-success/30">Óptimo</Badge>;
      },
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar producto…"
      emptyMessage="No se encontraron medicamentos."
      enableColumnDrag={true}
      persistPreferences={true}
      storageKey="reporte-stock-bajo-table"
      minColumnWidth={80}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
}

function ProximosAVencerTable({
  items,
  medicamentoById,
}: {
  items: any[];
  medicamentoById: Map<number, any>;
}) {
  const columns: DataTableColumn<any>[] = [
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (l) => {
        const m = medicamentoById.get(l.medicament_id || l.id_medicamento);
        return m?.name || m?.nombre || `Medicamento #${l.medicament_id || l.id_medicamento}`;
      },
      resizable: true,
      width: 220,
      render: (val) => <span className="font-medium text-xs">{String(val)}</span>,
    },
    {
      key: "batch_number",
      header: "N° Lote",
      accessor: (l) => l.batch_number || l.numero_lote,
      resizable: true,
      width: 130,
      render: (val) => <span className="font-mono text-xs">{String(val ?? "—")}</span>,
    },
    {
      key: "expiration_date",
      header: "Vencimiento",
      accessor: (l) => l.expiration_date || l.fecha_vencimiento,
      resizable: true,
      width: 130,
      render: (_, l) => <span className="font-mono text-xs">{formatDate(l.expiration_date || l.fecha_vencimiento)}</span>,
    },
    {
      key: "dias",
      header: "Tiempo Restante",
      accessor: (l) => diasHasta(l.expiration_date || l.fecha_vencimiento),
      resizable: true,
      width: 150,
      render: (_, l) => {
        const dias = diasHasta(l.expiration_date || l.fecha_vencimiento);
        return (
          <Badge variant={dias <= 0 ? "destructive" : dias <= 30 ? "warning" : "secondary"}>
            {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : dias === 0 ? "Vence hoy" : `${dias} días`}
          </Badge>
        );
      },
    },
    {
      key: "current_quantity",
      header: "Stock Lote",
      accessor: (l) => Number(l.current_quantity ?? l.cantidad_actual ?? 0),
      resizable: true,
      width: 120,
      render: (_, l) => <span className="font-mono text-xs font-semibold">{l.current_quantity ?? l.cantidad_actual ?? 0} uds</span>,
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar por medicamento o N° de lote…"
      emptyMessage="No se encontraron lotes."
      enableColumnDrag={true}
      persistPreferences={true}
      storageKey="reporte-por-vencer-table"
      minColumnWidth={80}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
}

function KardexTabla({ idMedicamento }: { idMedicamento: number }) {
  const [kardex, setKardex] = useState<KardexMovimientoConLote[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setKardex(null);
    fetchKardexByMedicamento(idMedicamento, controller.signal)
      .then(setKardex)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setKardex([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [idMedicamento]);

  if (loading || kardex === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (kardex.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-background/60">
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          Sin movimientos registrados para este medicamento.
        </CardContent>
      </Card>
    );
  }

  const columns: DataTableColumn<any>[] = [
    {
      key: "tipo",
      header: "Tipo",
      accessor: (k: any) => TIPO_META[k.tipo || k.type]?.label || k.tipo || k.type,
      resizable: true,
      width: 120,
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
      resizable: true,
      width: 130,
      render: (val) => <span className="font-mono text-xs">{String(val)}</span>,
    },
    {
      key: "cantidad",
      header: "Cantidad",
      accessor: (k: any) => k.cantidad ?? k.quantity,
      resizable: true,
      width: 110,
      render: (_, k: any) => {
        const cant = Number(k.cantidad ?? k.quantity ?? 0);
        const isEntry = k.tipo === "in" || k.tipo === "entrada" || k.type === "in" || k.type === "entrada";
        return (
          <span className={`font-mono text-xs font-semibold ${isEntry ? "text-success" : "text-destructive"}`}>
            {isEntry ? "+" : "-"}{Math.abs(cant)}
          </span>
        );
      },
    },
    {
      key: "saldo",
      header: "Saldo Resultante",
      accessor: (k: any) => k.saldo ?? k.balance,
      resizable: true,
      width: 150,
      render: (_, k: any) => <span className="font-mono text-xs font-bold">{k.saldo ?? k.balance ?? 0} uds</span>,
    },
    {
      key: "motivo",
      header: "Motivo / Detalle",
      accessor: (k: any) => k.motivo || k.reason || "—",
      resizable: true,
      width: 200,
      render: (_, k: any) => (
        <span className="text-muted-foreground text-xs">{k.motivo || k.reason || "—"}</span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha y Hora",
      accessor: (k: any) => k.fecha || k.fecha_hora || k.occurred_at || k.created_at || "",
      resizable: true,
      width: 160,
      render: (_, k: any) => <span className="text-xs text-muted-foreground font-mono">{formatDateTime(k.fecha || k.fecha_hora || k.occurred_at || k.created_at)}</span>,
    },
  ];

  return (
    <DataTable
      data={kardex}
      columns={columns}
      searchPlaceholder="Buscar por N° de lote o motivo…"
      emptyMessage="No se encontraron movimientos."
      enableColumnDrag={true}
      persistPreferences={true}
      storageKey="reporte-kardex-table"
      minColumnWidth={80}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
}
