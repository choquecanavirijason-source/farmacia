"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  Shield,
  Key,
  Users,
  MoreHorizontal,
  Pencil,
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
  update,
  exportResource,
} from "@/lib/api/roles";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { IRole, RoleTableEditableField } from "@/lib/types/role";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function RolesPage() {
  const router = useRouter();
  const { can } = useAuth();

  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IRole[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para eliminación
  const [deleteTarget, setDeleteTarget] = useState<IRole | null>(null);
  const [selectedRows, setSelectedRows] = useState<IRole[]>([]);
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

  // Consulta de roles desde la API
  useEffect(() => {
    const controller = new AbortController();

    getPaginated(
      {
        page: params.page,
        per_page: params.pageSize,
        search: params.search,
        sort_by: params.sort?.key || "id",
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
        setError(err?.response?.data?.message || err?.message || "Error al cargar los roles.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey]);

  // Edición rápida inline en la tabla
  const saveField = useCallback(
    async (role: IRole, field: RoleTableEditableField, value: string) => {
      try {
        const updatePayload = { [field]: value };
        await update(role.id, updatePayload);
        toast.success("Rol actualizado con éxito.");
        refresh();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "No se pudo actualizar el rol.");
        throw err;
      }
    },
    [refresh]
  );

  // Confirmación de eliminación individual
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success(`Rol "${deleteTarget.name}" eliminado con éxito.`);
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "No se pudo eliminar el rol.");
    }
  }

  // Confirmación de eliminación masiva
  async function confirmBulkDelete() {
    if (selectedRows.length === 0) return;
    try {
      const ids = selectedRows.map((r) => r.id);
      await bulkDestroy(ids);
      toast.success(`${selectedRows.length} roles eliminados.`);
      setSelectedRows([]);
      setSelectionClearKey((k) => k + 1);
      setBulkDeleteOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "No se pudieron eliminar los roles seleccionados.");
    }
  }

  // Exportación a Excel o PDF
  async function handleExport(format: "excel" | "pdf") {
    try {
      toast.info(`Generando archivo ${format.toUpperCase()}...`);
      const blob = await exportResource(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roles_${new Date().toISOString().slice(0, 10)}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Archivo descargado correctamente.");
    } catch {
      toast.error("Error al exportar los roles.");
    }
  }

  // Columnas para el DataTable
  const columns: DataTableColumn<IRole>[] = [
    {
      key: "id",
      header: "ID",
      accessor: (r) => r.id,
      className: "w-16 font-mono text-xs text-muted-foreground",
    },
    {
      key: "name",
      header: "Nombre del Rol",
      accessor: (r) => r.name,
      resizable: true,
      width: 250,
      edit: can(PERMISSIONS.EDIT_ROLES) ? { onSave: (role, val) => saveField(role, "name", String(val)) } : undefined,
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary shrink-0" />
          <Link
            href={`/roles/editar?id=${r.id}`}
            className="font-semibold text-xs capitalize hover:underline text-foreground"
          >
            {r.name}
          </Link>
          {r.name?.toLowerCase() === "administrator" && (
            <Badge variant="outline" className="text-[10px] font-normal border-primary/40 text-primary">
              Sistema
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "permissions_count",
      header: "Permisos Otorgados",
      accessor: (r) => r.permissions_count ?? r.permissions?.length ?? 0,
      className: "text-center",
      render: (_, r) => {
        const count = r.permissions_count ?? r.permissions?.length ?? 0;
        return (
          <div className="flex items-center justify-center gap-1.5 font-medium text-xs">
            <Key className="size-3.5 text-muted-foreground" />
            <Badge variant="secondary" className="font-mono text-xs">
              {count} permisos
            </Badge>
          </div>
        );
      },
    },
    {
      key: "users_count",
      header: "Usuarios Asignados",
      accessor: (r) => r.users_count ?? 0,
      className: "text-center",
      render: (_, r) => {
        const count = r.users_count ?? 0;
        return (
          <div className="flex items-center justify-center gap-1.5 font-medium text-xs text-muted-foreground">
            <Users className="size-3.5" />
            <span>{count} usuario(s)</span>
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Fecha de Creación",
      accessor: (r) => r.created_at,
      className: "whitespace-nowrap text-xs text-muted-foreground",
      render: (_, r) => (r.created_at ? new Date(r.created_at).toLocaleDateString("es-ES") : "—"),
    },
    {
      key: "acciones",
      header: "Acciones",
      accessor: () => null,
      sortable: false,
      filterable: false,
      resizable: false,
      className: "w-28",
      render: (_, r) => {
        const isSystem = r.name?.toLowerCase() === "administrator";

        if (!can(PERMISSIONS.EDIT_ROLES) && (!can(PERMISSIONS.DELETE_ROLES) || isSystem)) {
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
                    aria-label={`Acciones para ${r.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_ROLES) && (
                  <DropdownMenuItem
                    nativeButton={false}
                    render={<Link href={`/roles/editar?id=${r.id}`} />}
                  >
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_ROLES) && !isSystem && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(r)}
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
      {/* Encabezado con título y acciones */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles y Permisos
          </h1>
          <p className="text-sm text-muted-foreground">
            Administración de perfiles de acceso y permisos granulares del sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón para eliminar seleccionados */}
          {can(PERMISSIONS.DELETE_ROLES) && selectedRows.length > 0 && (
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

          {/* Botón para crear nuevo rol mediante navegación de página */}
          {can(PERMISSIONS.CREATE_ROLES) && (
            <Button
              nativeButton={false}
              render={<Link href="/roles/nuevo" />}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Rol
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de datos con soporte para paginación y búsqueda en servidor */}
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
        searchPlaceholder="Buscar rol por nombre..."
        emptyMessage="No se encontraron roles configurados."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="roles.csv"
        onExport={
          can(PERMISSIONS.VIEW_ROLES)
            ? (format) =>
                exportResource(format, {
                  search: params.search,
                  sort_by: params.sort?.key,
                  sort_dir: params.sort?.direction,
                })
            : undefined
        }
        onRefresh={refresh}
        getRowId={(r) => r.id}
        onSelectionChange={can(PERMISSIONS.DELETE_ROLES) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="roles-table"
        minColumnWidth={80}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`¿Eliminar rol "${deleteTarget?.name}"?`}
        description="Esta acción eliminará el rol. Los usuarios que tengan asignado este rol perderán los permisos asociados."
        onConfirm={confirmDelete}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} roles seleccionados?`}
        description="Se eliminarán los roles seleccionados excepto los roles esenciales del sistema. ¿Deseas continuar?"
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}
