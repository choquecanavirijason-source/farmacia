"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
  Phone,
  MapPin,
  Users,
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
} from "@/lib/api/branches";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IBranch, BranchTableEditableField } from "@/lib/types/branch";
import { BranchFormDialog } from "./branch-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function SucursalesPage() {
  const { can } = useAuth();
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IBranch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IBranch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IBranch | null>(null);
  const [selectedRows, setSelectedRows] = useState<IBranch[]>([]);
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

  // Consulta de sucursales desde la API
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar las sucursales.");
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
  function openEdit(branch: IBranch) {
    if (branch.deleted_at) return;
    setEditing(branch);
    setFormOpen(true);
  }

  // Restauración de una sucursal eliminada lógicamente
  async function handleRestore(branch: IBranch) {
    try {
      await restore(branch.id);
      toast.success("Sucursal restaurada con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar la sucursal."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Sucursal actualizada." : "Sucursal creada.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(branch: IBranch, field: BranchTableEditableField, value: string) {
    if (branch.deleted_at) return;
    await update(branch.id, {
      [field]: value,
    });
    refresh();
  }

  // Definición de columnas de la tabla de sucursales
  const columns: DataTableColumn<IBranch>[] = [
    {
      key: "name",
      header: "Nombre",
      accessor: (b) => b.name,
      resizable: true,
      width: 220,
      edit: { onSave: (b, v) => saveField(b, "name", String(v)) },
      render: (_, b) => (
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-xs", b.deleted_at && "text-destructive line-through")}>
            {b.name}
          </span>
          {b.deleted_at ? (
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
              Eliminada
            </span>
          ) : b.status === "inactive" ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Inactiva
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      accessor: (b) => b.phone,
      resizable: true,
      width: 150,
      edit: { onSave: (b, v) => saveField(b, "phone", String(v)) },
      render: (_, b) => (
        <span className={cn("flex items-center gap-1.5 text-xs", b.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <Phone className="size-3.5" aria-hidden />
          <span className="font-mono">{b.phone || "-"}</span>
        </span>
      ),
    },
    {
      key: "address",
      header: "Dirección",
      accessor: (b) => b.address,
      resizable: true,
      width: 220,
      edit: { onSave: (b, v) => saveField(b, "address", String(v)) },
      render: (_, b) => (
        <span className={cn("flex items-center gap-1.5 text-xs", b.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <MapPin className="size-3.5" aria-hidden />
          <span className="truncate">{b.address || "-"}</span>
        </span>
      ),
    },
    {
      key: "users_count",
      header: "Usuarios",
      accessor: (b) => b.users_count ?? 0,
      sortable: false,
      resizable: true,
      width: 110,
      render: (_, b) => (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden />
          {b.users_count ?? 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Creado el",
      accessor: (b) => b.created_at ?? "",
      className: "w-36 text-xs text-muted-foreground",
      resizable: true,
      width: 140,
      render: (_, b) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(b.created_at)}
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
      render: (_, b) => {
        if (b.deleted_at) {
          if (!can(PERMISSIONS.RESTORE_BRANCHES)) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(b)}
                title="Restaurar sucursal"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        if (!can(PERMISSIONS.EDIT_BRANCHES) && !can(PERMISSIONS.DELETE_BRANCHES)) {
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
                    aria-label={`Acciones para ${b.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_BRANCHES) && (
                  <DropdownMenuItem onClick={() => openEdit(b)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_BRANCHES) && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(b)}
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
            Gestión de Sucursales
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las sucursales de la farmacia y los usuarios asignados a cada una.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.DELETE_BRANCHES) && selectedRows.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              className="shrink-0 gap-1.5"
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar seleccionadas ({selectedRows.length})
            </Button>
          )}
          {can(PERMISSIONS.CREATE_BRANCHES) && (
            <Button
              type="button"
              onClick={openCreate}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nueva Sucursal
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
        getRowClassName={(b) =>
          b.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre o dirección…"
        emptyMessage="No se encontraron sucursales."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="sucursales.csv"
        onExport={can(PERMISSIONS.EXPORT_BRANCHES) ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(b) => b.id}
        onSelectionChange={can(PERMISSIONS.DELETE_BRANCHES) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="sucursales-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <BranchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        branch={editing}
        onSaved={handleSaved}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar sucursal?"
        description={
          <>
            Se eliminará la sucursal <strong>{deleteTarget?.name}</strong> y quedará inaccesible para sus usuarios asignados.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Sucursal eliminada.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} sucursal(es)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} sucursal(es) seleccionada(s)</strong> y quedarán inaccesibles para sus usuarios.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((b) => b.id)
          );
          toast.success(result.message || "Sucursales eliminadas.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
