"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Eye,
  History,
  User as UserIcon,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import { getPaginated, exportResource } from "@/lib/api/audits";
import type { IAudit, IAuditFilterParams } from "@/lib/types/audit";
import { useBranchView } from "@/context/branch-view-context";
import { AuditDetailDialog } from "./audit-detail-dialog";
import { getFieldLabel, getModelLabel } from "@/lib/utils/audit-helpers";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la carga de datos del servidor
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "created_at", direction: "desc" },
};

export default function ActividadesPage() {
  const { branchScope } = useBranchView();
  // Estados para la paginación y ordenamiento en servidor
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IAudit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de filtros temporales y específicos
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");

  // Estado para el modal de detalle de auditoría
  const [selectedAudit, setSelectedAudit] = useState<IAudit | null>(null);

  // Función para recargar la tabla de datos
  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Manejo de cambios en parámetros (búsqueda, página, orden)
  const paramsRef = useRef(params);
  const handleParamsChange = useCallback((next: ServerFetchParams) => {
    const searchChanged = paramsRef.current.search !== next.search;
    paramsRef.current = next;
    if (!searchChanged) setLoading(true);
    setParams(next);
  }, []);

  // Efecto para consultar las actividades cuando cambian los filtros
  useEffect(() => {
    const controller = new AbortController();

    const queryParams: IAuditFilterParams = {
      page: params.page,
      per_page: params.pageSize,
      search: params.search,
      sort_by: params.sort?.key || "created_at",
      sort_dir: params.sort?.direction || "desc",
      period: period !== "all" ? period : undefined,
      date_from: period === "custom" && dateFrom ? dateFrom : undefined,
      date_to: period === "custom" && dateTo ? dateTo : undefined,
      event: eventFilter !== "all" ? eventFilter : undefined,
      model: modelFilter !== "all" ? modelFilter : undefined,
      branch_id: branchScope ?? "all",
    };

    getPaginated(queryParams, controller.signal)
      .then((result) => {
        setItems(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setError(null);
        if (result.data.length === 0 && result.meta?.total > 0 && params.page > 1) {
          setParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.message || err?.message || "Error al cargar las actividades.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, period, dateFrom, dateTo, eventFilter, modelFilter, refreshKey, branchScope]);

  // Manejo de exportación de registros a Excel y PDF
  const handleExport = async (format: "excel" | "pdf") => {
    return exportResource(format, {
      search: params.search,
      period: period !== "all" ? period : undefined,
      date_from: period === "custom" && dateFrom ? dateFrom : undefined,
      date_to: period === "custom" && dateTo ? dateTo : undefined,
      event: eventFilter !== "all" ? eventFilter : undefined,
      model: modelFilter !== "all" ? modelFilter : undefined,
      branch_id: branchScope ?? "all",
    });
  };

  // Mapeo de estilos y etiquetas en español para los tipos de evento
  const eventBadgeMap: Record<string, { label: string; className: string }> = {
    created: {
      label: "Creación",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    updated: {
      label: "Modificación",
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    deleted: {
      label: "Eliminación",
      className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    },
    restored: {
      label: "Restauración",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
  };

  // Definición de columnas de la tabla de auditoría
  const columns: DataTableColumn<IAudit>[] = [
    {
      key: "event",
      header: "Acción",
      accessor: (a) => a.event,
      resizable: true,
      width: 140,
      render: (_, a) => {
        const badge = eventBadgeMap[a.event] || {
          label: a.event,
          className: "bg-muted text-muted-foreground",
        };
        return (
          <Badge variant="outline" className={cn("text-xs font-medium", badge.className)}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: "user",
      header: "Usuario Responsable",
      accessor: (a) => a.user?.name || "Sistema",
      resizable: true,
      width: 200,
      render: (_, a) => (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserIcon className="size-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-xs truncate">
              {a.user?.name || "Sistema"}
            </span>
            {a.user?.email && (
              <span className="text-[10px] text-muted-foreground truncate">
                {a.user.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "auditable",
      header: "Módulo / Registro",
      accessor: (a) => a.subject_label || `${getModelLabel(a.auditable_type)} #${a.auditable_id}`,
      resizable: true,
      width: 220,
      render: (_, a) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium">
            {getModelLabel(a.auditable_type)}{" "}
            <span className="font-mono text-muted-foreground text-[11px]">#{a.auditable_id}</span>
          </span>
          {a.subject_label && (
            <span className="text-[11px] text-muted-foreground truncate max-w-52" title={a.subject_label}>
              {a.subject_label}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "branch",
      header: "Sucursal",
      accessor: (a) => a.branch?.name ?? "",
      resizable: true,
      width: 140,
      render: (_, a) => (
        <span className="text-xs text-muted-foreground">{a.branch?.name ?? "—"}</span>
      ),
    },
    {
      key: "changes",
      header: "Campos Afectados",
      accessor: () => null,
      sortable: false,
      resizable: true,
      render: (_, a) => {
        const oldKeys = Object.keys(a.old_values || {});
        const newKeys = Object.keys(a.new_values || {});
        const allKeys = Array.from(new Set([...oldKeys, ...newKeys]));

        if (allKeys.length === 0) {
          return <span className="text-muted-foreground text-xs italic">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-sm">
            {allKeys.slice(0, 3).map((k) => (
              <span
                key={k}
                className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 border"
              >
                {getFieldLabel(k)}
              </span>
            ))}
            {allKeys.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-medium self-center">
                +{allKeys.length - 3} más
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "ip_address",
      header: "Dirección IP",
      accessor: (a) => a.ip_address,
      resizable: true,
      width: 130,
      render: (_, a) => (
        <span className="font-mono text-xs text-muted-foreground">
          {a.ip_address || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Fecha y Hora",
      accessor: (a) => a.created_at,
      resizable: true,
      width: 170,
      render: (_, a) => (
        <span className="text-xs text-muted-foreground">
          {new Date(a.created_at).toLocaleString("es-ES")}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      accessor: () => null,
      sortable: false,
      filterable: false,
      resizable: false,
      className: "w-20",
      render: (_, a) => (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedAudit(a)}
            title="Ver detalle completo de actividad"
          >
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Encabezado del módulo */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Registro de Actividades
            </h1>
            <Badge variant="outline" className="gap-1 font-mono text-xs">
              <History className="size-3" />
              Auditoría
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Historial detallado de todas las creaciones, ediciones y eliminaciones en el sistema.
          </p>
        </div>
      </div>

      {/* Barra de filtros de fecha y eventos */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filtros rápidos por período de tiempo */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Período:
            </span>
            <Button
              type="button"
              variant={period === "all" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("all")}
            >
              Todo
            </Button>
            <Button
              type="button"
              variant={period === "today" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("today")}
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("week")}
            >
              Esta Semana
            </Button>
            <Button
              type="button"
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("month")}
            >
              Este Mes
            </Button>
            <Button
              type="button"
              variant={period === "custom" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setPeriod("custom")}
            >
              <CalendarIcon className="size-3.5" />
              Personalizado
            </Button>
          </div>

          {/* Filtros específicos por Tipo de Evento y Módulo */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Filtrar por tipo de acción"
              >
                <option value="all">Todas las acciones</option>
                <option value="created">Creaciones</option>
                <option value="updated">Modificaciones</option>
                <option value="deleted">Eliminaciones</option>
                <option value="restored">Restauraciones</option>
              </select>
            </div>

            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Filtrar por módulo"
            >
              <option value="all">Todos los módulos</option>
              <option value="Client">Clientes</option>
              <option value="Medicament">Medicamentos</option>
              <option value="Sale">Ventas</option>
              <option value="Purchase">Compras</option>
              <option value="User">Usuarios</option>
              <option value="CashRegister">Cajas</option>
              <option value="Batch">Lotes</option>
              <option value="Category">Categorías</option>
              <option value="Presentation">Presentaciones</option>
              <option value="Laboratory">Laboratorios</option>
              <option value="Supplier">Proveedores</option>
            </select>
          </div>
        </div>

        {/* Selector de rango de fechas cuando se activa el modo personalizado */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
            <span className="text-muted-foreground font-medium">Desde:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 rounded border border-input bg-background px-2 text-xs"
            />
            <span className="text-muted-foreground font-medium ml-2">Hasta:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 rounded border border-input bg-background px-2 text-xs"
            />
            {(dateFrom || dateTo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground gap-1"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                <X className="size-3" />
                Limpiar fechas
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabla de datos principal con componente reutilizable DataTable */}
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
        searchPlaceholder="Buscar por usuario, IP o módulo…"
        emptyMessage="No se encontraron registros de actividades."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="actividades_auditoria.csv"
        onExport={handleExport}
        onRefresh={refresh}
        getRowId={(a) => a.id}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="actividades-auditoria-table"
        minColumnWidth={80}
      />

      {/* Diálogo modal para ver el detalle y diferencias de campos de una auditoría */}
      <AuditDetailDialog
        audit={selectedAudit}
        open={Boolean(selectedAudit)}
        onOpenChange={(open) => !open && setSelectedAudit(null)}
      />
    </div>
  );
}
