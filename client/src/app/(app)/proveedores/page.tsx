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
  Mail,
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
} from "@/lib/api/suppliers";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { ISupplier, SupplierTableEditableField } from "@/lib/types/supplier";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function ProveedoresPage() {
  const { can } = useAuth();
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<ISupplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ISupplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ISupplier | null>(null);
  const [selectedRows, setSelectedRows] = useState<ISupplier[]>([]);
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

  // Consulta de proveedores desde la API
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar los proveedores.");
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
  function openEdit(proveedor: ISupplier) {
    if (proveedor.deleted_at) return;
    setEditing(proveedor);
    setFormOpen(true);
  }

  // Restauración de un proveedor eliminado lógicamente
  async function handleRestore(proveedor: ISupplier) {
    try {
      await restore(proveedor.id);
      toast.success("Proveedor restaurado con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar el proveedor."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Proveedor actualizado." : "Proveedor creado.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(supplier: ISupplier, field: SupplierTableEditableField, value: string) {
    if (supplier.deleted_at) return;
    await update(supplier.id, {
      [field]: value,
    });
    refresh();
  }

  // Definición de columnas de la tabla de proveedores
  const columns: DataTableColumn<ISupplier>[] = [
    {
      key: "name",
      header: "Nombre / Razón Social",
      accessor: (p) => p.name,
      resizable: true,
      width: 220,
      edit: { onSave: (p, v) => saveField(p, "name", String(v)) },
      render: (_, p) => (
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-xs", p.deleted_at && "text-destructive line-through")}>
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
      key: "nit",
      header: "NIT",
      accessor: (p) => p.nit,
      resizable: true,
      width: 140,
      edit: { onSave: (p, v) => saveField(p, "nit", String(v)) },
      render: (_, p) => (
        <span className={cn("font-mono text-xs", p.deleted_at && "text-destructive/80 line-through")}>
          {p.nit || "-"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      accessor: (p) => p.phone,
      resizable: true,
      width: 150,
      edit: { onSave: (p, v) => saveField(p, "phone", String(v)) },
      render: (_, p) => (
        <span className={cn("flex items-center gap-1.5 text-xs", p.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <Phone className="size-3.5" aria-hidden />
          <span className="font-mono">{p.phone || "-"}</span>
        </span>
      ),
    },
    {
      key: "email",
      header: "Correo Electrónico",
      accessor: (p) => p.email,
      resizable: true,
      width: 200,
      edit: { onSave: (p, v) => saveField(p, "email", String(v)) },
      render: (_, p) => (
        <span className={cn("flex items-center gap-1.5 text-xs", p.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <Mail className="size-3.5" aria-hidden />
          <span className="truncate">{p.email || "-"}</span>
        </span>
      ),
    },
    {
      key: "address",
      header: "Dirección",
      accessor: (p) => p.address,
      resizable: true,
      width: 220,
      edit: { onSave: (p, v) => saveField(p, "address", String(v)) },
      render: (_, p) => (
        <span className={cn("flex items-center gap-1.5 text-xs", p.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <MapPin className="size-3.5" aria-hidden />
          <span className="truncate">{p.address || "-"}</span>
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
      render: (_, p) => {
        if (p.deleted_at) {
          if (!can(PERMISSIONS.RESTORE_SUPPLIERS)) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(p)}
                title="Restaurar proveedor"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        if (!can(PERMISSIONS.EDIT_SUPPLIERS) && !can(PERMISSIONS.DELETE_SUPPLIERS)) {
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
                    aria-label={`Acciones para ${p.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_SUPPLIERS) && (
                  <DropdownMenuItem onClick={() => openEdit(p)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_SUPPLIERS) && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(p)}
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
            Gestión de Proveedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los laboratorios y distribuidores de medicamentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.DELETE_SUPPLIERS) && selectedRows.length > 0 && (
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
          {can(PERMISSIONS.CREATE_SUPPLIERS) && (
            <Button
              type="button"
              onClick={openCreate}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Proveedor
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
        getRowClassName={(p) =>
          p.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre, NIT, teléfono o email…"
        emptyMessage="No se encontraron proveedores."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="proveedores.csv"
        onExport={can(PERMISSIONS.EXPORT_SUPPLIERS) ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(p) => p.id}
        onSelectionChange={can(PERMISSIONS.DELETE_SUPPLIERS) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="proveedores-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editing}
        onSaved={handleSaved}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar proveedor?"
        description={
          <>
            Se eliminará el proveedor <strong>{deleteTarget?.name}</strong> y sus datos asociados.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Proveedor eliminado.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} proveedor(es)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} proveedor(es) seleccionado(s)</strong> y sus datos asociados.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((p) => p.id)
          );
          toast.success(result.message || "Proveedores eliminados.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
