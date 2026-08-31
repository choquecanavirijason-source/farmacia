"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Eye,
  Filter,
  Pill,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCategorias, fetchLaboratorios } from "@/lib/api/catalogs";
import { fetchLotes } from "@/lib/api/batches";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { formatCurrency } from "@/lib/format";
import type { Categoria, Laboratorio, Lote, Medicamento } from "@/lib/types";
import { MedicamentBatchesSheet } from "./medicament-batches-sheet";
import { cn } from "@/lib/utils";

interface InventoryRow extends Medicamento {
  stock_actual: number;
  categoria_nombre: string;
  laboratorio_nombre: string;
  estado_stock: "agotado" | "bajo" | "ok";
  valor_inventario: number;
}

export default function InventarioPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [verLotesDe, setVerLotesDe] = useState<Medicamento | null>(null);

  // Filtros
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [laboratorioFilter, setLaboratorioFilter] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetchMedicamentos(),
      fetchLotes(),
      fetchCategorias(),
      fetchLaboratorios(),
    ]).then(([m, l, c, labs]) => {
      setMedicamentos(m);
      setLotes(l);
      setCategorias(c);
      setLaboratorios(labs);
    });
  }, []);

  const categoriaById = useMemo(
    () => new Map(categorias.map((c) => [c.id_categoria, c.nombre])),
    [categorias]
  );

  const laboratorioById = useMemo(
    () => new Map(laboratorios.map((lab) => [lab.id_laboratorio, lab.nombre])),
    [laboratorios]
  );

  const stockPorMedicamento = useMemo(() => {
    const map = new Map<number, number>();
    for (const l of lotes) {
      const medId = l.id_medicamento || (l as any).medicament_id;
      const qty = Number(l.cantidad_actual || (l as any).current_quantity || 0);
      map.set(medId, (map.get(medId) ?? 0) + qty);
    }
    return map;
  }, [lotes]);

  // Lista enriquecida de inventario
  const rows: InventoryRow[] = useMemo(() => {
    if (!medicamentos) return [];

    return medicamentos.map((m) => {
      const stock = stockPorMedicamento.get(m.id_medicamento) ?? 0;
      const estadoStock: "agotado" | "bajo" | "ok" =
        stock <= 0 ? "agotado" : stock < m.stock_minimo ? "bajo" : "ok";
      const catNombre = categoriaById.get(m.id_categoria) ?? "General";
      const labNombre = laboratorioById.get(m.id_laboratorio) ?? "—";
      const valor = stock * (m.precio_venta || 0);

      return {
        ...m,
        stock_actual: stock,
        categoria_nombre: catNombre,
        laboratorio_nombre: labNombre,
        estado_stock: estadoStock,
        valor_inventario: valor,
      };
    });
  }, [medicamentos, stockPorMedicamento, categoriaById, laboratorioById]);

  // Filtros locales aplicados
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (stockFilter === "low" && row.estado_stock !== "bajo") return false;
      if (stockFilter === "out" && row.estado_stock !== "agotado") return false;
      if (stockFilter === "ok" && row.estado_stock !== "ok") return false;
      if (categoriaFilter && String(row.id_categoria) !== categoriaFilter) return false;
      if (laboratorioFilter && String(row.id_laboratorio) !== laboratorioFilter) return false;
      return true;
    });
  }, [rows, stockFilter, categoriaFilter, laboratorioFilter]);

  // Métricas para tarjetas KPI
  const stats = useMemo(() => {
    const totalItems = rows.length;
    const lowStockCount = rows.filter((r) => r.estado_stock === "bajo").length;
    const outOfStockCount = rows.filter((r) => r.estado_stock === "agotado").length;
    const totalInventoryValue = rows.reduce((acc, r) => acc + r.valor_inventario, 0);

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
    };
  }, [rows]);

  const isLoading = medicamentos === null;
  const hasAny = (medicamentos?.length ?? 0) > 0;

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: "codigo",
      header: "Código",
      accessor: (m) => m.codigo,
      className: "w-28 font-mono text-xs",
      render: (_, m) => <span className="font-mono text-xs font-semibold">{m.codigo}</span>,
    },
    {
      key: "nombre",
      header: "Medicamento",
      accessor: (m) => m.nombre,
      className: "min-w-48 max-w-72",
      render: (_, m) => (
        <div className="flex flex-col">
          <span className="font-medium text-xs text-foreground" title={m.nombre}>
            {m.nombre}
          </span>
          {m.concentracion ? (
            <span className="text-[11px] text-muted-foreground">{m.concentracion}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "categoria_nombre",
      header: "Categoría",
      accessor: (m) => m.categoria_nombre,
      className: "w-36",
      render: (_, m) => (
        <Badge variant="outline" className="text-[11px] font-normal">
          {m.categoria_nombre}
        </Badge>
      ),
    },
    {
      key: "laboratorio_nombre",
      header: "Laboratorio",
      accessor: (m) => m.laboratorio_nombre,
      className: "w-36 text-xs text-muted-foreground",
    },
    {
      key: "precio_venta",
      header: "P. Venta",
      accessor: (m) => Number(m.precio_venta),
      className: "w-28 text-right font-mono text-xs",
      render: (_, m) => (
        <span className="font-mono text-xs font-medium">
          {formatCurrency(Number(m.precio_venta))}
        </span>
      ),
    },
    {
      key: "stock_actual",
      header: "Stock Actual",
      accessor: (m) => m.stock_actual,
      className: "w-28 text-center",
      render: (_, m) => (
        <span
          className={cn(
            "font-mono text-xs font-bold px-2 py-0.5 rounded-full inline-block",
            m.stock_actual === 0
              ? "bg-destructive/15 text-destructive"
              : m.stock_actual < m.stock_minimo
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-success/15 text-success"
          )}
        >
          {m.stock_actual} uds
        </span>
      ),
    },
    {
      key: "stock_minimo",
      header: "Stock Mínimo",
      accessor: (m) => m.stock_minimo,
      className: "w-24 text-center font-mono text-xs text-muted-foreground",
      render: (_, m) => <span className="font-mono text-xs">{m.stock_minimo} uds</span>,
    },
    {
      key: "estado_stock",
      header: "Estado",
      accessor: (m) => m.estado_stock,
      className: "w-28 text-center",
      render: (_, m) => {
        if (m.estado_stock === "agotado") {
          return <Badge variant="destructive" className="text-[10px]">Agotado</Badge>;
        }
        if (m.estado_stock === "bajo") {
          return <Badge variant="warning" className="text-[10px]">Stock Bajo</Badge>;
        }
        return <Badge variant="success" className="text-[10px]">Disponible</Badge>;
      },
    },
    {
      key: "acciones",
      header: "Lotes",
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-20 text-center",
      render: (_, m) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ver lotes de ${m.nombre}`}
          title="Ver lotes y vencimientos"
          onClick={() => setVerLotesDe(m)}
        >
          <Eye className="size-4" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Consulta de Inventario
          </h1>
          <p className="text-sm text-muted-foreground">
            Control de existencias, stock disponible por medicamento y desglose detallado de lotes.
          </p>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen de Inventario */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Catálogo</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{stats.totalItems}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pill className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Stock Bajo</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{stats.lowStockCount}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-destructive">Agotados</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{stats.outOfStockCount}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <XCircle className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Valor Estimado</p>
              <p className="text-lg font-bold font-mono tracking-tight text-primary truncate">
                {formatCurrency(stats.totalInventoryValue)}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Boxes className="size-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros Avanzados */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span className="font-medium">Filtrar existencias:</span>
          </div>

          <Select value={stockFilter} onValueChange={(val) => setStockFilter(val || "all")}>
            <SelectTrigger className="h-8 min-w-44 w-auto text-xs px-3">
              <SelectValue>
                {stockFilter === "low"
                  ? "Stock Bajo"
                  : stockFilter === "out"
                  ? "Agotados (0 uds)"
                  : stockFilter === "ok"
                  ? "Stock Normal"
                  : "Todos los estados"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-44">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="low">Stock Bajo</SelectItem>
              <SelectItem value="out">Agotados (0 uds)</SelectItem>
              <SelectItem value="ok">Stock Normal</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-48">
            <SearchableSelect
              options={categorias.map((c) => ({
                value: String(c.id_categoria),
                label: c.nombre,
              }))}
              value={categoriaFilter}
              onValueChange={(val) => setCategoriaFilter(val)}
              placeholder="Todas las categorías…"
              searchPlaceholder="Buscar categoría…"
              clearable
            />
          </div>

          <div className="w-48">
            <SearchableSelect
              options={laboratorios.map((l) => ({
                value: String(l.id_laboratorio),
                label: l.nombre,
              }))}
              value={laboratorioFilter}
              onValueChange={(val) => setLaboratorioFilter(val)}
              placeholder="Todos los laboratorios…"
              searchPlaceholder="Buscar laboratorio…"
              clearable
            />
          </div>

          {(stockFilter !== "all" || categoriaFilter || laboratorioFilter) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStockFilter("all");
                setCategoriaFilter("");
                setLaboratorioFilter("");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : hasAny ? (
        <DataTable
          data={filteredRows}
          columns={columns}
          searchPlaceholder="Buscar por medicamento, código, categoría o laboratorio…"
          emptyMessage="No se encontraron medicamentos con los filtros aplicados."
          pageSizeOptions={[10, 20, 50, 100]}
          exportFilename="consulta_inventario.csv"
          storageKey="consulta-inventario-table"
          getRowId={(m) => m.id_medicamento}
        />
      ) : null}

      {!isLoading && !hasAny ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Aún no hay medicamentos registrados</p>
          </CardContent>
        </Card>
      ) : null}

      <MedicamentBatchesSheet
        medicamento={verLotesDe}
        lotes={lotes ?? []}
        open={Boolean(verLotesDe)}
        onOpenChange={(open) => !open && setVerLotesDe(null)}
      />
    </div>
  );
}
