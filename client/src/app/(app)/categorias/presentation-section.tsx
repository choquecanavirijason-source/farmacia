"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/lib/api/presentations";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IPresentation, PresentationTableEditableField } from "@/lib/types/presentation";
import { PresentationFormDialog } from "./presentation-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export function PresentationSection() {
  const { can } = useAuth();
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IPresentation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IPresentation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IPresentation | null>(null);
  const [selectedRows, setSelectedRows] = useState<IPresentation[]>([]);
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

  // Consulta de presentaciones desde la API
  useEffect(() => {
    const controller = new AbortController();

    getPaginated(
      {
        page: params.page,
        per_page: params.pageSize,
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar las presentaciones.");
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
  function openEdit(presentacion: IPresentation) {
    if (presentacion.deleted_at) return;
    setEditing(presentacion);
    setFormOpen(true);
  }

  // Restauración de una presentación eliminada lógicamente
  async function handleRestore(presentacion: IPresentation) {
    try {
      await restore(presentacion.id);
      toast.success("Presentación restaurada con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar la presentación."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Presentación actualizada." : "Presentación creada.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(presentation: IPresentation, field: PresentationTableEditableField, value: string) {
    if (presentation.deleted_at) return;
    await update(presentation.id, {
      [field]: value,
    });
    refresh();
  }

  // Definición de columnas de la tabla de presentaciones
  const columns: DataTableColumn<IPresentation>[] = [
    {
      key: "name",
      header: "Nombre de la Presentación",
      accessor: (p) => p.name,
      resizable: true,
      width: 250,
      edit: { onSave: (p, v) => saveField(p, "name", String(v)) },
      render: (_, p) => (
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-xs truncate", p.deleted_at && "text-destructive line-through")}>
            {p.name}
          </span>
          {p.deleted_at && (
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
              Eliminado
            </span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      accessor: (p) => p.description ?? "",
      resizable: true,
      edit: { onSave: (p, v) => saveField(p, "description", String(v)) },
      render: (_, p) => (
        <span className={cn("text-xs text-muted-foreground line-clamp-1", p.deleted_at && "text-destructive/80 line-through")}>
          {p.description || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Fecha de Registro",
      accessor: (p) => p.created_at,
      resizable: true,
      width: 160,
      render: (_, p) => (
        <span className="text-xs text-muted-foreground">
          {new Date(p.created_at).toLocaleDateString("es-ES")}
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
        render: (_, pres) => {
        if (pres.deleted_at) {
          if (!can(PERMISSIONS.RESTORE_PRESENTATIONS)) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(pres)}
                title="Restaurar presentación"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        if (!can(PERMISSIONS.EDIT_PRESENTATIONS) && !can(PERMISSIONS.DELETE_PRESENTATIONS)) {
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
                    aria-label={`Acciones para ${pres.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_PRESENTATIONS) && (
                  <DropdownMenuItem onClick={() => openEdit(pres)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_PRESENTATIONS) && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(pres)}
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
    <div className="flex flex-col gap-4">
      {/* Botones de acción superior */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {can(PERMISSIONS.DELETE_PRESENTATIONS) && selectedRows.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Eliminar seleccionadas ({selectedRows.length})
            </Button>
          )}
        </div>
        {can(PERMISSIONS.CREATE_PRESENTATIONS) && (
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden />
            Nueva Presentación
          </Button>
        )}
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
        getRowClassName={(p) =>
          p.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre o descripción…"
        emptyMessage="No se encontraron presentaciones."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="presentaciones.csv"
        onExport={can(PERMISSIONS.EXPORT_PRESENTATIONS) ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(p) => p.id}
        onSelectionChange={can(PERMISSIONS.DELETE_PRESENTATIONS) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="presentaciones-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <PresentationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        presentation={editing}
        onSaved={handleSaved}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar presentación?"
        description={
          <>
            Se eliminará la presentación <strong>{deleteTarget?.name}</strong>. Los medicamentos asociados mantendrán su histórico.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Presentación eliminada.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} presentación(es)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} presentación(es) seleccionada(s)</strong>.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((p) => p.id)
          );
          toast.success(result.message || "Presentaciones eliminadas.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
