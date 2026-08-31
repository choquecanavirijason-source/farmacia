"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
  User as UserIcon,
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
} from "@/lib/api/users";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IUser, UserTableEditableField } from "@/lib/types/user";
import { UserFormDialog } from "./user-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function UsuariosPage() {
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user, can } = useAuth();

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null);
  const [selectedRows, setSelectedRows] = useState<IUser[]>([]);
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

  // Consulta de usuarios desde la API
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar los usuarios.");
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
  function openEdit(usuario: IUser) {
    if (usuario.deleted_at) return;
    setEditing(usuario);
    setFormOpen(true);
  }

  // Restauración de un usuario eliminado lógicamente
  async function handleRestore(usuario: IUser) {
    try {
      await restore(usuario.id);
      toast.success("Usuario restaurado con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar el usuario."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Usuario actualizado." : "Usuario creado.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(u: IUser, field: UserTableEditableField, value: string) {
    if (u.deleted_at) return;
    await update(u.id, {
      [field]: value,
    });
    refresh();
  }

  // Definición de columnas de la tabla de usuarios
  const columns: DataTableColumn<IUser>[] = [
    {
      key: "name",
      header: "Nombre Completo",
      accessor: (u) => u.name,
      resizable: true,
      width: 220,
      edit: { onSave: (u, v) => saveField(u, "name", String(v)) },
      render: (_, u) => {
        const isSelf = u.id === user?.id;
        return (
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserIcon className="size-3.5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn("font-medium text-xs truncate", u.deleted_at && "text-destructive line-through")}>
                {u.name}
              </span>
              {isSelf && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  (tú)
                </span>
              )}
            </div>
            {u.deleted_at && (
              <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide shrink-0">
                Eliminado
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Correo Electrónico (Login)",
      accessor: (u) => u.email,
      resizable: true,
      width: 220,
      edit: { onSave: (u, v) => saveField(u, "email", String(v)) },
      render: (_, u) => (
        <span className={cn("text-xs font-mono truncate", u.deleted_at ? "text-destructive/80 line-through" : "text-muted-foreground")}>
          {u.email}
        </span>
      ),
    },
    {
      key: "role",
      header: "Rol",
      accessor: (u) => u.roles?.[0]?.name || "Vendedor",
      resizable: true,
      width: 140,
      render: (_, u) => {
        const roleName = u.roles?.[0]?.name;
        const isAdmin = roleName === "administrator" || roleName === "ADMINISTRADOR";
        return (
          <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px]">
            {isAdmin ? "Administrador" : "Vendedor"}
          </Badge>
        );
      },
    },
    {
      key: "state",
      header: "Estado",
      accessor: (u) => u.state,
      resizable: true,
      width: 110,
      render: (_, u) => (
        <Badge variant={u.state === "active" ? "success" : "secondary"} className="text-[10px]">
          {u.state === "active" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Fecha de Registro",
      accessor: (u) => u.created_at,
      resizable: true,
      width: 160,
      render: (_, u) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.created_at).toLocaleDateString("es-ES")}
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
      render: (_, u) => {
        if (u.deleted_at) {
          if (!can(PERMISSIONS.RESTORE_USERS)) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(u)}
                title="Restaurar usuario"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        const isSelf = u.id === user?.id;

        if (!can(PERMISSIONS.EDIT_USERS) && (!can(PERMISSIONS.DELETE_USERS) || isSelf)) {
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
                    aria-label={`Acciones para ${u.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_USERS) && (
                  <DropdownMenuItem onClick={() => openEdit(u)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_USERS) && (
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isSelf}
                    onClick={() => setDeleteTarget(u)}
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
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Cuentas de acceso al sistema, roles y estados de acceso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.DELETE_USERS) && selectedRows.length > 0 && (
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
          {can(PERMISSIONS.CREATE_USERS) && (
            <Button
              type="button"
              onClick={openCreate}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Usuario
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
        getRowClassName={(u) =>
          u.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre o correo electrónico…"
        emptyMessage="No se encontraron usuarios."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="usuarios.csv"
        onExport={can(PERMISSIONS.EXPORT_USERS) ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(u) => u.id}
        onSelectionChange={can(PERMISSIONS.DELETE_USERS) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="usuarios-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSaved={handleSaved}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar usuario?"
        description={
          <>
            Se eliminará el acceso de <strong>{deleteTarget?.name}</strong> al sistema.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Usuario eliminado.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} usuario(s)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} usuario(s) seleccionado(s)</strong> del sistema.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((u) => u.id)
          );
          toast.success(result.message || "Usuarios eliminados.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
