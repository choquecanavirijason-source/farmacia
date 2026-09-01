"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { PrintDialog } from "@/components/layout/print-dialog";
import type { StockBajoItem } from "./types";

interface LowStockSectionProps {
  stockAnalisis: StockBajoItem[] | null;
  loadingCatalogs: boolean;
}

export function LowStockSection({
  stockAnalisis,
  loadingCatalogs,
}: LowStockSectionProps) {
  const [stockFiltroVista, setStockFiltroVista] = useState<"todos" | "bajos" | "agotados">("todos");
  const [printOpen, setPrintOpen] = useState(false);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Inventory Metrics */}
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

      {/* Filter Bar */}
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
            onClick={() => setPrintOpen(true)}
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
        <LowStockTable items={stockFiltrado} />
      )}

      {/* Print Dialog */}
      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        title="Reporte: Estado de Inventario y Stock"
      >
        {stockFiltrado ? <LowStockTable items={stockFiltrado} /> : null}
      </PrintDialog>
    </div>
  );
}

function LowStockTable({ items }: { items: StockBajoItem[] }) {
  const columns: DataTableColumn<StockBajoItem>[] = [
    {
      key: "codigo",
      header: "Código",
      accessor: (i) => i.medicamento.code || i.medicamento.codigo || "-",
      className: "w-24 font-mono text-xs",
    },
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (i) => i.medicamento.name || i.medicamento.nombre,
      className: "font-medium text-xs",
    },
    {
      key: "stock",
      header: "Stock Actual",
      accessor: (i) => i.stock,
      className: "w-28 text-center font-mono text-xs font-bold",
      render: (_, i) => (
        <span
          className={
            i.stock === 0
              ? "text-destructive font-bold"
              : i.status === "critico"
              ? "text-amber-600 font-bold"
              : "text-foreground"
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
      className: "w-28 text-center font-mono text-xs text-muted-foreground",
      render: (_, i) => `${i.minStock} uds`,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (i) => i.status,
      className: "w-28 text-center",
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
    />
  );
}
