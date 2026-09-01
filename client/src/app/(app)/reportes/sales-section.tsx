"use client";

import { useMemo, useState } from "react";
import { Printer, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/table";
import { PrintDialog } from "@/components/layout/print-dialog";
import { SimpleBarChart } from "@/components/ui/simple-bar-chart";
import { DateRangeFilter } from "./date-range-filter";
import { formatCurrency, formatDate } from "@/lib/format";
import type { IDashboardStats } from "@/lib/api/dashboard";

interface SalesSectionProps {
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

export function SalesSection({
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
}: SalesSectionProps) {
  const [printOpen, setPrintOpen] = useState(false);

  const chartVentasData = useMemo(() => {
    if (!stats?.ventas_por_rango) return [];
    return stats.ventas_por_rango.map((d) => ({
      label: d.label,
      value: d.value,
    }));
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
            onClick={() => setPrintOpen(true)}
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

      {/* Print Dialog */}
      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
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
    </div>
  );
}
