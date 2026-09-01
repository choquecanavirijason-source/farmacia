"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/combobox";
import {
  getPaginated,
  exportResource,
  fetchCategorias,
  fetchLaboratorios,
} from "@/lib/api/medicaments";
import { fetchLotes } from "@/lib/api/batches";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency } from "@/lib/format";
import type { IMedicament } from "@/lib/types/medicament";
import type { Categoria, Laboratorio, Lote, Medicamento } from "@/lib/types";
import { MedicamentBatchesSheet } from "./medicament-batches-sheet";
import { cn } from "@/lib/utils";

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "name", direction: "asc" },
};

const STOCK_STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "low", label: "Stock Bajo (Crítico)" },
  { value: "out", label: "Agotados (0 uds)" },
  { value: "ok", label: "Stock Normal / Disponible" },
];

export default function InventarioPage() {
  const { can } = useAuth();
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IMedicament[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [laboratoryFilter, setLaboratoryFilter] = useState<string>("");

  // Catálogos auxiliares
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [allBatches, setAllBatches] = useState<Lote[]>([]);
  const [verLotesDe, setVerLotesDe] = useState<Medicamento | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const paramsRef = useRef(params);
  const handleParamsChange = useCallback((next: ServerFetchParams) => {
    const searchChanged = paramsRef.current.search !== next.search;
    paramsRef.current = next;
    if (!searchChanged) setLoading(true);
    setParams(next);
  }, []);

  // Carga de catálogos y lotes
  useEffect(() => {
    Promise.all([
      fetchCategorias().catch(() => []),
      fetchLaboratorios().catch(() => []),
      fetchLotes().catch(() => []),
    ]).then(([cats, labs, batches]) => {
      setCategorias(cats);
      setLaboratorios(labs);
      setAllBatches(batches);
    });
  }, []);

  // Carga paginada en servidor de medicamentos para inventario
  useEffect(() => {
    const controller = new AbortController();
    const filters: { category_id?: string; laboratory_id?: string; status?: string } = {};
    if (categoryFilter) filters.category_id = categoryFilter;
    if (laboratoryFilter) filters.laboratory_id = laboratoryFilter;

    getPaginated(params, controller.signal, filters)
      .then((result) => {
        let list = result.data || [];

        // Filtro de stock local si aplica
        if (statusFilter === "low") {
          list = list.filter((m: any) => {
            const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
            return stock > 0 && stock < m.min_stock;
          });
        } else if (statusFilter === "out") {
          list = list.filter((m: any) => Number(m.total_stock ?? m.stock_actual ?? 0) === 0);
        } else if (statusFilter === "ok") {
          list = list.filter((m: any) => {
            const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
            return stock >= m.min_stock && stock > 0;
          });
        }

        setItems(list);
        setTotal(statusFilter === "all" ? (result.meta?.total ?? list.length) : list.length);
        setError(null);
        if (list.length === 0 && (result.meta?.total ?? 0) > 0 && params.page > 1) {
          setParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        setError(err?.message || "Error al cargar el inventario.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey, statusFilter, categoryFilter, laboratoryFilter]);

  const handleRowReorder = useCallback(async () => {}, []);

  // Mapeos rápidos
  const categoriaById = useMemo(
    () => new Map(categorias.map((c) => [c.id_categoria || c.id, c.nombre || (c as any).name])),
    [categorias]
  );

  const laboratorioById = useMemo(
    () => new Map(laboratorios.map((l) => [l.id_laboratorio || l.id, l.nombre || (l as any).name])),
    [laboratorios]
  );

  const columns: DataTableColumn<IMedicament>[] = [
    {
      key: "code",
      header: "Código",
      accessor: (m) => m.code,
      className: "w-28",
      resizable: true,
      width: 120,
      render: (_, m) => <span className="font-mono text-xs font-semibold">{m.code}</span>,
    },
    {
      key: "name",
      header: "Medicamento / Concentración",
      accessor: (m) => m.name,
      className: "min-w-48 max-w-72",
      resizable: true,
      width: 260,
      render: (_, m) => (
        <div className="flex flex-col">
          <span className="font-medium text-xs text-foreground" title={m.name}>
            {m.name}
          </span>
          {m.concentration ? (
            <span className="text-[11px] text-muted-foreground">{m.concentration}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      accessor: (m) => (m as any).category?.name || categoriaById.get(m.category_id) || "—",
      className: "w-36",
      resizable: true,
      width: 160,
      render: (_, m) => {
        const catName = (m as any).category?.name || categoriaById.get(m.category_id) || "General";
        return (
          <Badge variant="outline" className="text-[11px] font-normal">
            {catName}
          </Badge>
        );
      },
    },
    {
      key: "laboratory",
      header: "Laboratorio",
      accessor: (m) => (m as any).laboratory?.name || laboratorioById.get(m.laboratory_id) || "—",
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 160,
      render: (_, m) => (
        <span className="text-xs text-muted-foreground">
          {(m as any).laboratory?.name || laboratorioById.get(m.laboratory_id) || "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "P. Venta",
      accessor: (m) => Number(m.price),
      className: "w-28 text-right font-mono text-xs",
      resizable: true,
      width: 120,
      render: (_, m) => (
        <span className="font-mono text-xs font-medium">
          {formatCurrency(Number(m.price))}
        </span>
      ),
    },
    {
      key: "stock_actual",
      header: "Stock Actual",
      accessor: (m: any) => Number(m.total_stock ?? m.stock_actual ?? 0),
      className: "w-28 text-center",
      resizable: true,
      width: 130,
      render: (_, m: any) => {
        const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
        return (
          <span
            className={cn(
              "font-mono text-xs font-bold px-2 py-0.5 rounded-full inline-block",
              stock === 0
                ? "bg-destructive/15 text-destructive"
                : stock < m.min_stock
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-success/15 text-success"
            )}
          >
            {stock} uds
          </span>
        );
      },
    },
    {
      key: "min_stock",
      header: "Stock Mín.",
      accessor: (m) => m.min_stock,
      className: "w-24 text-center font-mono text-xs text-muted-foreground",
      resizable: true,
      width: 110,
      render: (_, m) => <span className="font-mono text-xs">{m.min_stock} uds</span>,
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (m: any) => {
        const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
        return stock === 0 ? "Agotado" : stock < m.min_stock ? "Bajo" : "Disponible";
      },
      className: "w-28 text-center",
      resizable: true,
      width: 130,
      render: (_, m: any) => {
        const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
        if (stock === 0) {
          return <Badge variant="destructive" className="text-[10px]">Agotado</Badge>;
        }
        if (stock < m.min_stock) {
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
      resizable: false,
      className: "w-20 text-center",
      render: (_, m) => (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Ver lotes de ${m.name}`}
            title="Ver lotes y vencimientos"
            onClick={() =>
              setVerLotesDe({
                ...m,
                id_medicamento: m.id,
                codigo: m.code,
                nombre: m.name,
                concentracion: m.concentration ?? "",
                precio_venta: Number(m.price),
                stock_minimo: m.min_stock,
                requiere_receta: m.requires_prescription,
                estado: (m.status === "active" ? "activo" : "inactivo") as "activo" | "inactivo",
                id_categoria: m.category_id,
                id_presentacion: m.presentation_id,
                id_laboratorio: m.laboratory_id,
              })
            }
          >
            <Eye className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
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

      {/* Barra de Filtros con Select2 para todos los campos */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span className="font-medium">Filtrar por:</span>
          </div>

          <div className="w-56">
            <SearchableSelect
              options={STOCK_STATUS_OPTIONS}
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val || "all");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Estado de existencias…"
              searchPlaceholder="Filtrar por estado…"
            />
          </div>

          <div className="w-56">
            <SearchableSelect
              options={categorias.map((c) => ({
                value: String(c.id_categoria || c.id),
                label: c.nombre || (c as any).name,
              }))}
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val || "");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Todas las categorías…"
              searchPlaceholder="Buscar categoría…"
              clearable
            />
          </div>

          <div className="w-56">
            <SearchableSelect
              options={laboratorios.map((l) => ({
                value: String(l.id_laboratorio || l.id),
                label: l.nombre || (l as any).name,
              }))}
              value={laboratoryFilter}
              onValueChange={(val) => {
                setLaboratoryFilter(val || "");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Todos los laboratorios…"
              searchPlaceholder="Buscar laboratorio…"
              clearable
            />
          </div>

          {(statusFilter !== "all" || categoryFilter || laboratoryFilter) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("");
                setLaboratoryFilter("");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      </div>

      {/* DataTable Idéntico a Clientes con Paginación en Servidor y Persistencia */}
      <DataTable
        data={items}
        columns={columns}
        server={{
          params,
          onParamsChange: handleParamsChange,
          total,
          loading,
          error,
          onRetry: refresh,
        }}
        getRowClassName={(m: any) => {
          const stock = Number(m.total_stock ?? m.stock_actual ?? 0);
          if (stock === 0) {
            return "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20";
          }
          if (stock < m.min_stock) {
            return "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20";
          }
          return undefined;
        }}
        searchPlaceholder="Buscar medicamento por nombre o código…"
        emptyMessage="No se encontraron medicamentos en el inventario."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="consulta_inventario.csv"
        onExport={
          can(PERMISSIONS.EXPORT_MEDICAMENTS)
            ? (format) =>
                exportResource(format, {
                  status: statusFilter,
                  category_id: categoryFilter,
                  laboratory_id: laboratoryFilter,
                  search: params.search,
                  sort_by: params.sort?.key,
                  sort_dir: params.sort?.direction,
                })
            : undefined
        }
        onRefresh={refresh}
        getRowId={(m) => m.id}
        enableColumnDrag={true}
        enableRowDrag={true}
        onRowReorder={handleRowReorder}
        persistPreferences={true}
        storageKey="inventario-table"
        minColumnWidth={80}
      />

      <MedicamentBatchesSheet
        medicamento={verLotesDe}
        lotes={allBatches}
        open={Boolean(verLotesDe)}
        onOpenChange={(open) => !open && setVerLotesDe(null)}
      />
    </div>
  );
}
