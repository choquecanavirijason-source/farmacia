"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, FileText, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getSalesPaginated, exportSales } from "@/lib/api/sales";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { ISale } from "@/lib/types/sale";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { VoidSaleDialog } from "./void-sale-dialog";
import { InvoiceSheet } from "./invoice-sheet";
import { cn } from "@/lib/utils";

function formatDateSafe(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "sale_date", direction: "desc" },
};

export function SalesHistory() {
  const { can } = useAuth();
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<ISale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros adicionales
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [voidTarget, setVoidTarget] = useState<ISale | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<ISale | null>(null);

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

  useEffect(() => {
    const controller = new AbortController();

    const filters: { status?: string; start_date?: string; end_date?: string } = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;

    getSalesPaginated(params, controller.signal, filters)
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
        setError(err?.message || "Error al cargar el historial de ventas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey, statusFilter, startDate, endDate]);

  const columns: DataTableColumn<ISale>[] = [
    {
      key: "id",
      header: "N° Venta",
      accessor: (s) => s.id,
      className: "w-24",
      width: 100,
      render: (_, s) => (
        <span className={cn("font-mono text-xs font-semibold", s.status === "voided" && "line-through text-destructive")}>
          #{s.id}
        </span>
      ),
    },
    {
      key: "sale_date",
      header: "Fecha y Hora",
      accessor: (s) => s.sale_date || s.created_at,
      className: "w-44",
      width: 180,
      render: (_, s) => (
        <span className="text-xs text-muted-foreground">
          {formatDateSafe(s.sale_date || s.created_at)}
        </span>
      ),
    },
    {
      key: "cliente",
      header: "Cliente / Razón Social",
      accessor: (s) => s.client ? `${s.client.firstname ?? ""} ${s.client.lastname ?? ""}`.trim() || "Cliente General" : "Cliente General",
      className: "min-w-44",
      width: 220,
      render: (_, s) => {
        const clientName = s.client
          ? `${s.client.firstname ?? ""} ${s.client.lastname ?? ""}`.trim() || "Cliente General"
          : "Cliente General";
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">
              {clientName}
            </span>
            {s.client?.nit || s.client?.ci ? (
              <span className="text-[11px] font-mono text-muted-foreground">
                NIT/CI: {s.client.nit || s.client.ci}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      accessor: (s) => Number(s.total || 0),
      className: "w-32",
      width: 140,
      render: (_, s) => (
        <span className={cn("font-mono text-xs font-bold", s.status === "voided" && "line-through text-destructive/80")}>
          {formatCurrency(Number(s.total || 0))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (s) => s.status,
      className: "w-32",
      width: 130,
      render: (_, s) => (
        <Badge variant={s.status === "active" || s.status === "activa" ? "success" : "destructive"} className="text-[11px]">
          {s.status === "active" || s.status === "activa" ? "Completada" : "Anulada"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Creado el",
      accessor: (s) => s.created_at ?? "",
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 140,
      render: (_, s) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(s.created_at)}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Actualizado el",
      accessor: (s) => s.updated_at ?? "",
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 140,
      render: (_, s) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(s.updated_at)}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-28 text-right",
      render: (_, s) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setInvoiceTarget(s)}
            title="Ver comprobante"
          >
            <FileText className="size-4" />
          </Button>
          {can(PERMISSIONS.VOID_SALES) && (s.status === "active" || s.status === "activa") && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setVoidTarget(s)}
              title="Anular venta"
            >
              <Ban className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros Avanzados */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span className="font-medium">Filtrar por:</span>
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "all"); setParams((p) => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="h-8 min-w-40 w-auto text-xs px-3">
              <SelectValue>
                {statusFilter === "active"
                  ? "Completadas"
                  : statusFilter === "voided"
                  ? "Anuladas"
                  : "Todos los estados"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-40">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Completadas</SelectItem>
              <SelectItem value="voided">Anuladas</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setParams((p) => ({ ...p, page: 1 })); }}
              className="h-8 text-xs w-36"
              placeholder="Desde"
              aria-label="Fecha inicio"
            />
            <span className="text-xs text-muted-foreground">a</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setParams((p) => ({ ...p, page: 1 })); }}
              className="h-8 text-xs w-36"
              placeholder="Hasta"
              aria-label="Fecha fin"
            />
          </div>

          {(statusFilter !== "all" || startDate || endDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setStartDate("");
                setEndDate("");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

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
        searchPlaceholder="Buscar por cliente, NIT/CI o N° de venta…"
        emptyMessage="No se encontraron ventas con los criterios seleccionados."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="historial_ventas.csv"
        onExport={
          can(PERMISSIONS.EXPORT_SALES)
            ? (format) =>
                exportSales(format, {
                  status: statusFilter,
                  start_date: startDate,
                  end_date: endDate,
                  search: params.search,
                  sort_by: params.sort?.key,
                  sort_dir: params.sort?.direction,
                })
            : undefined
        }
        onRefresh={refresh}
        getRowId={(s) => s.id}
        storageKey="ventas-history-table"
      />

      <VoidSaleDialog
        open={Boolean(voidTarget)}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        sale={voidTarget}
        onVoided={refresh}
      />

      <InvoiceSheet
        open={Boolean(invoiceTarget)}
        onOpenChange={(open) => !open && setInvoiceTarget(null)}
        sale={invoiceTarget}
      />
    </div>
  );
}

// Alias de compatibilidad
export const HistorialVentas = SalesHistory;
