"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import {
  getPaginated,
  remove,
  bulkDestroy,
  restore,
  update,
  exportResource,
} from "@/lib/api/medicaments";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IMedicament, MedicamentTableEditableField } from "@/lib/types/medicament";
import { MedicamentFormDialog } from "./medicament-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function MedicamentosPage() {
  const { can } = useAuth();
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IMedicament[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IMedicament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IMedicament | null>(null);
  const [selectedRows, setSelectedRows] = useState<IMedicament[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectionClearKey, setSelectionClearKey] = useState(0);

  // Función para recargar la tabla
  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Manejador de cambio de parámetros de tabla
  const paramsRef = useRef(params);
  const handleParamsChange = useCallback((next: ServerFetchParams) => {
    const searchChanged = paramsRef.current.search !== next.search;
    paramsRef.current = next;
    if (!searchChanged) setLoading(true);
    setParams(next);
  }, []);

  // Consulta de medicamentos desde la API
  useEffect(() => {
    const controller = new AbortController();

    getPaginated(
      {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        sort_by: params.sort?.key || "name",
        sort_dir: params.sort?.direction || "asc",
      },
      controller.signal
    )
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar los medicamentos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey]);

  // Apertura de modal de creación
  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  // Apertura de modal de edición
  function openEdit(medicamento: IMedicament) {
    if (medicamento.deleted_at) return;
    setEditing(medicamento);
    setFormOpen(true);
  }

  // Restauración de un medicamento eliminado lógicamente
  async function handleRestore(medicamento: IMedicament) {
    try {
      await restore(medicamento.id);
      toast.success("Medicamento restaurado con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar el medicamento."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Medicamento actualizado." : "Medicamento creado.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(medicamento: IMedicament, field: MedicamentTableEditableField, value: string | number) {
    if (medicamento.deleted_at) return;
    await update(medicamento.id, {
      [field]: field === "price" || field === "min_stock" ? Number(value) : value,
    });
    refresh();
  }

  function handleScanClick() {
    toast.info("El lector de código de barras está listo para capturar datos.");
  }

  // Definición de columnas de la tabla de medicamentos
  const columns: DataTableColumn<IMedicament>[] = [
    {
      key: "code",
      header: "Código",
      accessor: (m) => m.code,
      resizable: true,
      width: 120,
      edit: { onSave: (m, v) => saveField(m, "code", String(v)) },
      render: (_, m) => (
        <span className={cn("font-mono text-xs", m.deleted_at && "text-destructive line-through")}>
          {m.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Nombre",
      accessor: (m) => m.name,
      resizable: true,
      width: 230,
      edit: { onSave: (m, v) => saveField(m, "name", String(v)) },
      render: (_, m) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col min-w-0">
            <span className={cn("font-medium text-xs truncate", m.deleted_at && "text-destructive line-through")}>
              {m.name}
            </span>
            {m.concentration && (
              <span className={cn("text-[11px] text-muted-foreground truncate", m.deleted_at && "line-through")}>
                {m.concentration}
              </span>
            )}
          </div>
          {m.deleted_at && (
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide shrink-0">
              Eliminado
            </span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      accessor: (m) => m.category?.name || "-",
      resizable: true,
      width: 140,
      render: (_, m) => (
        <span className={cn("text-xs", m.deleted_at && "text-destructive/80 line-through")}>
          {m.category?.name || "-"}
        </span>
      ),
    },
    {
      key: "presentation",
      header: "Presentación",
      accessor: (m) => m.presentation?.name || "-",
      resizable: true,
      width: 130,
      render: (_, m) => (
        <span className={cn("text-xs", m.deleted_at && "text-destructive/80 line-through")}>
          {m.presentation?.name || "-"}
        </span>
      ),
    },
    {
      key: "laboratory",
      header: "Laboratorio",
      accessor: (m) => m.laboratory?.name || "-",
      resizable: true,
      width: 140,
      render: (_, m) => (
        <span className={cn("text-xs", m.deleted_at && "text-destructive/80 line-through")}>
          {m.laboratory?.name || "-"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Precio",
      accessor: (m) => Number(m.price),
      resizable: true,
      width: 110,
      className: "text-right",
      edit: { type: "number", onSave: (m, v) => saveField(m, "price", Number(v)) },
      render: (_, m) => (
        <span className={cn("font-medium text-xs", m.deleted_at && "text-destructive line-through")}>
          {formatCurrency(Number(m.price))}
        </span>
      ),
    },
    {
      key: "min_stock",
      header: "Stock Mín.",
      accessor: (m) => m.min_stock,
      resizable: true,
      width: 100,
      className: "text-right",
      edit: { type: "number", onSave: (m, v) => saveField(m, "min_stock", Number(v)) },
      render: (_, m) => (
        <span className={cn("font-mono text-xs", m.deleted_at && "text-destructive line-through")}>
          {m.min_stock}
        </span>
      ),
    },
    {
      key: "requires_prescription",
      header: "Receta",
      accessor: (m) => (m.requires_prescription ? "Sí" : "No"),
      resizable: true,
      width: 90,
      render: (_, m) => (
        <Badge variant={m.requires_prescription ? "outline" : "secondary"} className="text-[10px]">
          {m.requires_prescription ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (m) => m.status,
      resizable: true,
      width: 100,
      render: (_, m) => (
        <Badge variant={m.status === "active" ? "success" : "secondary"} className="text-[10px]">
          {m.status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Creado el",
      accessor: (m) => m.created_at ?? "",
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 140,
      render: (_, m) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(m.created_at)}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Actualizado el",
      accessor: (m) => m.updated_at ?? "",
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 140,
      render: (_, m) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(m.updated_at)}
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
      className: "w-28",
      render: (_, m) => {
        if (m.deleted_at) {
          if (!can(PERMISSIONS.RESTORE_MEDICAMENTS)) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(m)}
                title="Restaurar medicamento"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        if (!can(PERMISSIONS.EDIT_MEDICAMENTS) && !can(PERMISSIONS.DELETE_MEDICAMENTS)) {
          return null;
        }

        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones para ${m.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_MEDICAMENTS) && (
                  <DropdownMenuItem onClick={() => openEdit(m)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_MEDICAMENTS) && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(m)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Encabezado del módulo */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de Medicamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo general: código, concentración, precios, categorías y stock de seguridad.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.DELETE_MEDICAMENTS) && selectedRows.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              className="shrink-0 gap-1.5"
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar seleccionados ({selectedRows.length})
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleScanClick}
            aria-label="Escanear código de barras"
            title="Escanear código de barras"
          >
            <ScanLine className="size-4" aria-hidden />
          </Button>
          {can(PERMISSIONS.CREATE_MEDICAMENTS) && (
            <Button
              type="button"
              onClick={openCreate}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Medicamento
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de datos principal */}
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
        getRowClassName={(m) =>
          m.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre, código o concentración…"
        emptyMessage="No se encontraron medicamentos."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="medicamentos.csv"
        onExport={
          can(PERMISSIONS.EXPORT_MEDICAMENTS)
            ? (format) =>
                exportResource(format, {
                  search: params.search,
                  sort_by: params.sort?.key,
                  sort_dir: params.sort?.direction,
                })
            : undefined
        }
        onRefresh={refresh}
        getRowId={(m) => m.id}
        onSelectionChange={can(PERMISSIONS.DELETE_MEDICAMENTS) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="medicamentos-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <MedicamentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        medicament={editing}
        onSaved={handleSaved}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar medicamento?"
        description={
          <>
            Se eliminará el medicamento <strong>{deleteTarget?.name}</strong> del catálogo.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Medicamento eliminado.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} medicamento(s)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} medicamento(s) seleccionado(s)</strong> del catálogo.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((m) => m.id)
          );
          toast.success(result.message || "Medicamentos eliminados.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
