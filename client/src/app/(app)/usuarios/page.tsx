"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
  User as UserIcon,
  Shield,
  Filter,
  AtSign,
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
import { SearchableSelect } from "@/components/ui/combobox";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import {
  getPaginated,
  remove,
  bulkDestroy,
  restore,
  update,
  exportResource,
} from "@/lib/api/users";
import { fetchRoles } from "@/lib/api/roles";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IUser, UserTableEditableField } from "@/lib/types/user";
import type { IRole } from "@/lib/types/role";
import { UserFormDialog } from "./user-form-dialog";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "name", direction: "asc" },
};

const USER_STATUS_OPTIONS = [
  { value: "active", label: "Usuarios Activos" },
  { value: "trashed", label: "Papelera (Eliminados)" },
  { value: "all", label: "Todos los registros (incluye papelera)" },
];

export default function UsuariosPage() {
  const { user: currentUser, can } = useAuth();

  // Estados de datos y paginación en servidor
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [availableRoles, setAvailableRoles] = useState<IRole[]>([]);

  // Estados de formularios y eliminación
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null);
  const [selectedRows, setSelectedRows] = useState<IUser[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectionClearKey, setSelectionClearKey] = useState(0);

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

  // Carga de roles disponibles para el filtro
  useEffect(() => {
    fetchRoles()
      .then(setAvailableRoles)
      .catch(() => setAvailableRoles([]));
  }, []);

  // Consulta paginada de usuarios desde la API
  useEffect(() => {
    const controller = new AbortController();
    const filters: { status?: string; role?: string } = {};
    if (statusFilter) filters.status = statusFilter;
    if (roleFilter) filters.role = roleFilter;

    getPaginated(params, controller.signal, filters)
      .then((result) => {
        setItems(result.data || []);
        setTotal(result.meta?.total ?? result.data?.length ?? 0);
        setError(null);
        if ((result.data?.length ?? 0) === 0 && (result.meta?.total ?? 0) > 0 && params.page > 1) {
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
  }, [params, refreshKey, statusFilter, roleFilter]);

  const handleRowReorder = useCallback(async () => {}, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(usuario: IUser) {
    if (usuario.deleted_at) return;
    setEditing(usuario);
    setFormOpen(true);
  }

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

  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Usuario actualizado." : "Usuario creado.");
    refresh();
  }

  async function saveField(usuario: IUser, field: UserTableEditableField, value: string) {
    if (usuario.deleted_at) return;
    await update(usuario.id, {
      [field]: value,
    });
    refresh();
  }

  // Opciones de roles para el filtro Select2
  const roleFilterOptions = useMemo(() => {
    return availableRoles.map((r) => ({
      value: r.name,
      label: r.name === "administrator" ? "Administrador" : r.name === "seller" ? "Vendedor" : r.name,
    }));
  }, [availableRoles]);

  const columns: DataTableColumn<IUser>[] = [
    {
      key: "firstname",
      header: "Nombres",
      accessor: (u) => u.firstname || u.name?.split(" ")[0] || "",
      className: "min-w-40 max-w-60",
      resizable: true,
      width: 180,
      edit: { onSave: (u, v) => saveField(u, "firstname", String(v)) },
      render: (_, u) => {
        const isSelf = currentUser?.id === u.id;
        const isDeleted = Boolean(u.deleted_at);
        const firstname = u.firstname || u.name?.split(" ")[0] || "—";

        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                u.roles?.some((r) => r.name === "administrator")
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {firstname.charAt(0).toUpperCase()}
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "font-medium text-xs truncate",
                  isDeleted && "line-through text-muted-foreground"
                )}
                title={firstname}
              >
                {firstname}
              </span>
              {isSelf && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                  Tú
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "lastname",
      header: "Apellidos",
      accessor: (u) => u.lastname || u.name?.split(" ").slice(1).join(" ") || "",
      className: "min-w-40 max-w-60",
      resizable: true,
      width: 180,
      edit: { onSave: (u, v) => saveField(u, "lastname", String(v)) },
      render: (_, u) => {
        const isDeleted = Boolean(u.deleted_at);
        const lastname = u.lastname || u.name?.split(" ").slice(1).join(" ") || "—";

        return (
          <span
            className={cn(
              "text-xs font-medium text-foreground truncate",
              isDeleted && "line-through text-muted-foreground"
            )}
            title={lastname}
          >
            {lastname}
          </span>
        );
      },
    },
    {
      key: "username",
      header: "Usuario",
      accessor: (u) => u.username || "",
      className: "w-36",
      resizable: true,
      width: 140,
      edit: { onSave: (u, v) => saveField(u, "username", String(v)) },
      render: (_, u) => (
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
          <AtSign className="size-3 text-muted-foreground/60 shrink-0" />
          <span>{u.username || "—"}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Correo Electrónico",
      accessor: (u) => u.email,
      className: "min-w-44",
      resizable: true,
      width: 220,
      edit: { onSave: (u, v) => saveField(u, "email", String(v)) },
      render: (_, u) => (
        <span className="text-xs text-muted-foreground truncate" title={u.email}>
          {u.email}
        </span>
      ),
    },
    {
      key: "roles",
      header: "Roles Asignados",
      accessor: (u) => u.roles?.map((r) => r.name).join(", ") ?? "",
      className: "min-w-44 max-w-64",
      resizable: true,
      width: 200,
      render: (_, u) => {
        const roles = u.roles || [];
        if (roles.length === 0) {
          return <span className="text-xs text-muted-foreground italic">Sin rol</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 items-center">
            {roles.map((r) => {
              const isAdmin = r.name === "administrator";
              const roleLabel = isAdmin ? "Administrador" : r.name === "seller" ? "Vendedor" : r.name;
              return (
                <Badge
                  key={r.id || r.name}
                  variant={isAdmin ? "default" : "secondary"}
                  className="text-[11px] gap-1 font-normal capitalize py-0.5"
                >
                  {isAdmin ? <Shield className="size-3" /> : <UserIcon className="size-3" />}
                  {roleLabel}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      resizable: false,
      className: "w-20 text-center",
      render: (_, u) => {
        const isSelf = currentUser?.id === u.id;
        const isDeleted = Boolean(u.deleted_at);
        const isRootAdmin = u.id === 1 || u.username === "admin" || u.email === "admin@farmacia.bo";

        if (isDeleted) {
          return (
            <div className="flex justify-center">
              {can(PERMISSIONS.RESTORE_USERS) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(u)}
                  className="h-7 px-2 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <RotateCcw className="size-3.5" />
                  Restaurar
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic">Papelera</span>
              )}
            </div>
          );
        }

        return (
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
                <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2">
                  <Pencil className="size-4" aria-hidden />
                  Editar usuario
                </DropdownMenuItem>
              )}
              {can(PERMISSIONS.DELETE_USERS) && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(u)}
                  disabled={isSelf || isRootAdmin}
                  className="gap-2"
                >
                  <Trash2 className="size-4" aria-hidden />
                  {isSelf
                    ? "No puedes eliminarte"
                    : isRootAdmin
                    ? "Admin principal protegido"
                    : "Eliminar"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los accesos, nombres, usuarios (username), contraseñas y asignación de roles.
          </p>
        </div>
        {can(PERMISSIONS.CREATE_USERS) && (
          <Button onClick={openCreate} className="shrink-0 gap-1.5">
            <Plus className="size-4" aria-hidden />
            Nuevo Usuario
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

          <div className="w-64">
            <SearchableSelect
              options={USER_STATUS_OPTIONS}
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val || "active");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Estado del usuario…"
              searchPlaceholder="Filtrar por estado…"
            />
          </div>

          <div className="w-56">
            <SearchableSelect
              options={roleFilterOptions}
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val || "");
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Todos los roles…"
              searchPlaceholder="Buscar rol…"
              clearable
            />
          </div>

          {(statusFilter !== "active" || roleFilter) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("active");
                setRoleFilter("");
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
        getRowClassName={(u) =>
          u.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre, usuario (@username) o correo…"
        emptyMessage={
          statusFilter === "trashed"
            ? "No hay usuarios eliminados en la papelera."
            : "No se encontraron usuarios."
        }
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="usuarios.csv"
        onExport={
          can(PERMISSIONS.EXPORT_USERS)
            ? (format) =>
                exportResource(format, {
                  status: statusFilter,
                  role: roleFilter,
                  search: params.search,
                  sort_by: params.sort?.key,
                  sort_dir: params.sort?.direction,
                })
            : undefined
        }
        onRefresh={refresh}
        getRowId={(u) => u.id}
        enableSelection={can(PERMISSIONS.DELETE_USERS)}
        onSelectionChange={can(PERMISSIONS.DELETE_USERS) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={true}
        onRowReorder={handleRowReorder}
        persistPreferences={true}
        storageKey="usuarios-table"
        minColumnWidth={80}
      />

      {/* Modal para Crear y Editar Usuario */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        currentUserId={currentUser?.id}
        availableRoles={availableRoles}
        onSaved={handleSaved}
      />

      {/* Diálogo de Confirmación para Eliminación Individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar usuario?"
        description={`¿Estás seguro de que deseas eliminar a "${deleteTarget?.name}"? Esta acción se puede revertir luego desde la papelera.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await remove(deleteTarget.id);
            toast.success("Usuario enviado a la papelera.");
            setDeleteTarget(null);
            refresh();
          } catch (err: any) {
            toast.error(
              err?.response?.data?.message ||
              err?.message ||
              "No se pudo eliminar el usuario."
            );
          }
        }}
      />

      {/* Diálogo de Confirmación para Eliminación Masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="¿Eliminar usuarios seleccionados?"
        description={`Se enviarán ${selectedRows.length} usuarios a la papelera. Podrás restaurarlos más adelante.`}
        onConfirm={async () => {
          try {
            await bulkDestroy(selectedRows.map((r) => r.id));
            toast.success(`${selectedRows.length} usuarios eliminados con éxito.`);
            setBulkDeleteOpen(false);
            setSelectedRows([]);
            setSelectionClearKey((k) => k + 1);
            refresh();
          } catch (err: any) {
            toast.error(
              err?.response?.data?.message ||
              err?.message ||
              "No se pudieron eliminar los usuarios seleccionados."
            );
          }
        }}
      />
    </div>
  );
}
