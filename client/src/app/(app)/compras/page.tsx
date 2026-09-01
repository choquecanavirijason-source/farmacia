"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Eye,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/combobox";
import {
  getPurchasesPaginated,
  exportPurchases,
} from "@/lib/api/purchases";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { fetchProveedores } from "@/lib/api/suppliers";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IPurchase } from "@/lib/types/purchase";
import type { Compra, Medicamento, Proveedor } from "@/lib/types";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { PurchaseDetailSheet } from "./purchase-detail-sheet";

function formatDateSafe(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "purchase_date", direction: "desc" },
};

export default function ComprasPage() {
  const { can } = useAuth();
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IPurchase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros
  const [proveedorFilter, setProveedorFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Catálogos auxiliares
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [detalleTarget, setDetalleTarget] = useState<Compra | null>(null);

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

  // Carga de proveedores y medicamentos
  useEffect(() => {
    Promise.all([
      fetchProveedores().catch(() => []),
      fetchMedicamentos().catch(() => []),
    ]).then(([provData, medData]) => {
      setProveedores(provData);
      setMedicamentos(medData);
    });
  }, []);

  // Carga paginada en servidor de compras
  useEffect(() => {
    const controller = new AbortController();
    const filters: { supplier_id?: string; start_date?: string; end_date?: string } = {};
    if (proveedorFilter) filters.supplier_id = proveedorFilter;
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;

    getPurchasesPaginated(params, controller.signal, filters)
      .then((result) => {
        setItems(result.data || []);
        setTotal(result.meta?.total ?? result.data?.length ?? 0);
        setError(null);
        if (result.data?.length === 0 && (result.meta?.total ?? 0) > 0 && params.page > 1) {
          setParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        setError(err?.message || "Error al cargar las compras.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey, proveedorFilter, startDate, endDate]);

  const handleRowReorder = useCallback(async () => {}, []);

  const proveedorById = useMemo(
    () => new Map(proveedores.map((p) => [p.id_proveedor || p.id, p])),
    [proveedores]
  );

  function handleSaved(saved: Compra) {
    toast.success(`Compra registrada — factura ${saved.numero_factura}.`);
    refresh();
  }

  const puedeRegistrar = proveedores.length > 0 && medicamentos.length > 0;

  const columns: DataTableColumn<IPurchase>[] = [
    {
      key: "invoice_number",
      header: "N° Factura",
      accessor: (c) => c.invoice_number,
      className: "w-36 font-mono text-xs",
      resizable: true,
      width: 140,
      render: (_, c) => (
        <span className="font-mono text-xs font-semibold">
          {c.invoice_number || `#${c.id}`}
        </span>
      ),
    },
    {
      key: "supplier",
      header: "Proveedor",
      accessor: (c) => (c as any).supplier?.name || proveedorById.get(c.supplier_id)?.nombre || "—",
      className: "min-w-48 max-w-72",
      resizable: true,
      width: 260,
      render: (_, c) => {
        const prov = (c as any).supplier || proveedorById.get(c.supplier_id);
        const name = prov?.name || prov?.nombre || "Proveedor no asignado";
        const nit = prov?.nit;

        return (
          <div className="flex flex-col">
            <span className="font-medium text-xs text-foreground">
              {name}
            </span>
            {nit ? (
              <span className="text-[11px] font-mono text-muted-foreground">
                NIT: {nit}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "purchase_date",
      header: "Fecha de Compra",
      accessor: (c) => c.purchase_date,
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 160,
      render: (_, c) => <span>{formatDateSafe(c.purchase_date || (c as any).created_at)}</span>,
    },
    {
      key: "total",
      header: "Total Invertido",
      accessor: (c) => Number(c.total || 0),
      className: "w-36 text-right font-mono text-xs",
      resizable: true,
      width: 150,
      render: (_, c) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {formatCurrency(Number(c.total || 0))}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Detalle",
      accessor: () => null,
      sortable: false,
      filterable: false,
      resizable: false,
      className: "w-20 text-center",
      render: (_, c) => (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Ver detalle de la factura ${c.invoice_number}`}
            title="Ver detalle y productos de la compra"
            onClick={() =>
              setDetalleTarget({
                id_compra: c.id,
                id: c.id,
                id_proveedor: c.supplier_id,
                supplier_id: c.supplier_id,
                numero_factura: c.invoice_number,
                invoice_number: c.invoice_number,
                fecha_compra: c.purchase_date,
                purchase_date: c.purchase_date,
                total: Number(c.total),
              } as any)
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
            Registro de Compras
          </h1>
          <p className="text-sm text-muted-foreground">
            Adquisición de mercadería, ingreso de lotes y actualización automática de stock.
          </p>
        </div>
        {can(PERMISSIONS.CREATE_PURCHASES) && (
          <Button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={!puedeRegistrar}
            className="shrink-0 gap-1.5"
            title={puedeRegistrar ? undefined : "Registra al menos un proveedor y un medicamento primero"}
          >
            <Plus className="size-4" aria-hidden />
            Nueva Compra
          </Button>
        )}
      </div>

      {/* Barra de Filtros con Select2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span className="font-medium">Filtrar por:</span>
          </div>

          <div className="w-60">
            <SearchableSelect
              options={proveedores.map((p) => ({
                value: String(p.id_proveedor || p.id),
                label: p.nombre || p.name,
                sublabel: p.nit ? `NIT: ${p.nit}` : undefined,
              }))}
              value={proveedorFilter}
              onValueChange={(val) => {
                setProveedorFilter(val || "");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Todos los proveedores…"
              searchPlaceholder="Buscar proveedor…"
              clearable
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-9 text-xs w-36"
              placeholder="Desde"
              aria-label="Fecha inicio"
            />
            <span className="text-xs text-muted-foreground">a</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-9 text-xs w-36"
              placeholder="Hasta"
              aria-label="Fecha fin"
            />
          </div>

          {(proveedorFilter || startDate || endDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setProveedorFilter("");
                setStartDate("");
                setEndDate("");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      </div>

      {/* DataTable Idéntico a Clientes e Inventario con Paginación en Servidor */}
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
        searchPlaceholder="Buscar por N° de factura o proveedor…"
        emptyMessage="No se encontraron compras con los criterios seleccionados."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="registro_compras.csv"
        onExport={(format) =>
          exportPurchases(format, {
            supplier_id: proveedorFilter,
            start_date: startDate,
            end_date: endDate,
            search: params.search,
            sort_by: params.sort?.key,
            sort_dir: params.sort?.direction,
          })
        }
        onRefresh={refresh}
        getRowId={(c) => c.id}
        enableColumnDrag={true}
        enableRowDrag={true}
        onRowReorder={handleRowReorder}
        persistPreferences={true}
        storageKey="compras-table"
        minColumnWidth={80}
      />

      <PurchaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proveedores={proveedores}
        medicamentos={medicamentos}
        onCompraRegistrada={handleSaved}
      />

      <PurchaseDetailSheet
        compra={detalleTarget}
        proveedores={proveedores}
        medicamentos={medicamentos}
        open={Boolean(detalleTarget)}
        onOpenChange={(open) => !open && setDetalleTarget(null)}
      />
    </div>
  );
}
