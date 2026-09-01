"use client";

import { useMemo, useState } from "react";
import { DollarSign, Flame, Package, Printer, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { PrintDialog } from "@/components/layout/print-dialog";
import { SimpleBarChart } from "@/components/ui/simple-bar-chart";
import { DateRangeFilter } from "./date-range-filter";
import { formatCurrency, formatDate } from "@/lib/format";
import type { IDashboardStats } from "@/lib/api/dashboard";

interface TopProductsSectionProps {
  stats: IDashboardStats | null;
  loadingStats: boolean;
  startDate: string;
  endDate: string;
  preset: string;
  appliedStartDate: string;
  appliedEndDate: string;
  onPresetChange: (preset: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyFilters: () => void;
}

export function TopProductsSection({
  stats,
  loadingStats,
  startDate,
  endDate,
  preset,
  appliedStartDate,
  appliedEndDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
}: TopProductsSectionProps) {
  const [printOpen, setPrintOpen] = useState(false);

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
    <div className="flex flex-col gap-4">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          preset={preset}
          onPresetChange={onPresetChange}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onApply={onApplyFilters}
          isLoading={loadingStats}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setPrintOpen(true)}
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
              Prueba seleccionando otro rango de fechas en el filtro superior.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Quick Metrics */}
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

          {/* Bar Chart */}
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

          {/* Ranking Table */}
          <TopProductsTable items={stats.top_productos} totalUnidades={totalUnidadesTop} />
        </div>
      )}

      {/* Print Dialog */}
      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        title={`Top Productos Más Vendidos — ${appliedStartDate ? formatDate(appliedStartDate) : ""} al ${appliedEndDate ? formatDate(appliedEndDate) : ""}`}
      >
        {stats?.top_productos ? (
          <TopProductsTable items={stats.top_productos} totalUnidades={totalUnidadesTop} />
        ) : null}
      </PrintDialog>
    </div>
  );
}

function TopProductsTable({
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
      className: "w-24 text-center font-bold text-xs",
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
      className: "w-28 font-mono text-xs",
    },
    {
      key: "name",
      header: "Medicamento",
      accessor: (i) => i.name,
      className: "font-semibold text-xs",
    },
    {
      key: "total_vendido",
      header: "Uds. Vendidas",
      accessor: (i) => Number(i.total_vendido),
      className: "w-32 text-right font-mono text-xs font-semibold",
      render: (_, i) => `${i.total_vendido} uds`,
    },
    {
      key: "porcentaje",
      header: "% del Top",
      accessor: (i) => totalUnidades > 0 ? (Number(i.total_vendido) / totalUnidades) * 100 : 0,
      className: "w-28 text-center font-mono text-xs text-muted-foreground",
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
      className: "w-36 text-right font-mono text-xs font-bold text-primary",
      render: (_, i) => formatCurrency(Number(i.total_recaudado)),
    },
  ];

  return (
    <DataTable
      data={rankedItems}
      columns={columns}
      searchPlaceholder="Buscar producto..."
      emptyMessage="No se encontraron productos."
    />
  );
}
