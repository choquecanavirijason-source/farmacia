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
} from "@/lib/api/categories";
import { useAuth } from "@/context/auth-context";
import type { ICategory, CategoryTableEditableField } from "@/lib/types/category";
import { CategoryFormDialog } from "./category-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export function CategorySection() {
  const { can } = useAuth();
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<ICategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ICategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [selectedRows, setSelectedRows] = useState<ICategory[]>([]);
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

  // Consulta de categorías desde la API
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar las categorías.");
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
  function openEdit(categoria: ICategory) {
    if (categoria.deleted_at) return;
    setEditing(categoria);
    setFormOpen(true);
  }

  // Restauración de una categoría eliminada lógicamente
  async function handleRestore(categoria: ICategory) {
    try {
      await restore(categoria.id);
      toast.success("Categoría restaurada con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar la categoría."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Categoría actualizada." : "Categoría creada.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(category: ICategory, field: CategoryTableEditableField, value: string) {
    if (category.deleted_at) return;
    await update(category.id, {
      [field]: value,
    });
    refresh();
  }

  // Definición de columnas de la tabla de categorías
  const columns: DataTableColumn<ICategory>[] = [
    {
      key: "name",
      header: "Nombre de la Categoría",
      accessor: (c) => c.name,
      resizable: true,
      width: 250,
      edit: { onSave: (c, v) => saveField(c, "name", String(v)) },
      render: (_, c) => (
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-xs truncate", c.deleted_at && "text-destructive line-through")}>
            {c.name}
          </span>
          {c.deleted_at && (
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
      accessor: (c) => c.description ?? "",
      resizable: true,
      edit: { onSave: (c, v) => saveField(c, "description", String(v)) },
      render: (_, c) => (
        <span className={cn("text-xs text-muted-foreground line-clamp-1", c.deleted_at && "text-destructive/80 line-through")}>
          {c.description || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Fecha de Registro",
      accessor: (c) => c.created_at,
      resizable: true,
      width: 160,
      render: (_, c) => (
        <span className="text-xs text-muted-foreground">
          {new Date(c.created_at).toLocaleDateString("es-ES")}
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
      className: "w-24",
      render: (_, c) => {
        if (c.deleted_at) {
          if (!can("restore categories")) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(c)}
                title="Restaurar categoría"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        if (!can("edit categories") && !can("delete categories")) {
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
                    aria-label={`Acciones para ${c.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can("edit categories") && (
                  <DropdownMenuItem onClick={() => openEdit(c)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can("delete categories") && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(c)}
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
          {can("delete categories") && selectedRows.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Eliminar seleccionados ({selectedRows.length})
            </Button>
          )}
        </div>
        {can("create categories") && (
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden />
            Nueva Categoría
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
        getRowClassName={(c) =>
          c.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre o descripción…"
        emptyMessage="No se encontraron categorías."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="categorias.csv"
        onExport={can("export categories") ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(c) => c.id}
        onSelectionChange={can("delete categories") ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="categorias-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSaved={handleSaved}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar categoría?"
        description={
          <>
            Se eliminará la categoría <strong>{deleteTarget?.name}</strong>. Los medicamentos asociados mantendrán su histórico.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Categoría eliminada.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} categoría(s)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} categoría(s) seleccionada(s)</strong>.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((c) => c.id)
          );
          toast.success(result.message || "Categorías eliminadas.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
