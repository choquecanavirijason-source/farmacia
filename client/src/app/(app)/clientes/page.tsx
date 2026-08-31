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
  remove,
  bulkDestroy,
  exportResource,
  getPaginated,
  update,
  restore,
} from "@/lib/api/clients";
import { useAuth } from "@/context/auth-context";
import type { IClient, ClientTableEditableField } from "@/lib/types/client";
import { ClientFormDialog } from "./client-form-dialog";
import { cn } from "@/lib/utils";

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function ClientesPage() {
  const { can } = useAuth();
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IClient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IClient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IClient | null>(null);
  const [selectedRows, setSelectedRows] = useState<IClient[]>([]);
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

  useEffect(() => {
    const controller = new AbortController();

    getPaginated(params, controller.signal)
      .then((result) => {
        setItems(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setError(null);
        if (result.data.length === 0 && result.meta?.total > 0 && params.page > 1) {
          setParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        setError(err?.message || "Error al cargar los clientes.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey]);

  const handleRowReorder = useCallback(async () => {
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(cliente: IClient) {
    if (cliente.deleted_at) return;
    setEditing(cliente);
    setFormOpen(true);
  }

  async function handleRestore(client: IClient) {
    try {
      await restore(client.id);
      toast.success("Cliente restaurado con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar el cliente."
      );
    }
  }

  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Cliente actualizado." : "Cliente creado.");
    refresh();
  }

  async function saveField(client: IClient, field: ClientTableEditableField, value: string) {
    if (client.deleted_at) return;
    await update(client.id, {
      [field]: value,
    });
    refresh();
  }

  const columns: DataTableColumn<IClient>[] = [
    {
      key: "ci",
      header: "CI",
      accessor: (u) => u.ci,
      className: "max-w-32",
      resizable: true,
      width: 130,
      edit: { onSave: (c, v) => saveField(c, "ci", String(v)) },
      render: (_, u) => (
        <span className={cn("font-mono text-xs", u.deleted_at && "text-destructive/80 line-through")}>
          {u.ci || "-"}
        </span>
      ),
    },
    {
      key: "nit",
      header: "NIT",
      accessor: (u) => u.nit,
      className: "max-w-32",
      resizable: true,
      width: 130,
      edit: { onSave: (c, v) => saveField(c, "nit", String(v)) },
      render: (_, u) => (
        <span className={cn("font-mono text-xs", u.deleted_at && "text-destructive/80 line-through")}>
          {u.nit || "-"}
        </span>
      ),
    },
    {
      key: "nombre",
      header: "Nombre",
      accessor: (u) => u.firstname,
      className: "min-w-32 max-w-48",
      resizable: true,
      width: 200,
      edit: { onSave: (c, v) => saveField(c, "firstname", String(v)) },
      render: (_, u) => (
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-xs", u.deleted_at && "text-destructive font-medium line-through")}>
            {u.firstname}
          </span>
          {u.deleted_at && (
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
              Eliminado
            </span>
          )}
        </div>
      ),
    },
    {
      key: "lastname",
      header: "Apellido",
      accessor: (u) => u.lastname,
      className: "min-w-32 max-w-48",
      resizable: true,
      width: 200,
      edit: { onSave: (c, v) => saveField(c, "lastname", String(v)) },
      render: (_, u) => (
        <span className={cn("font-mono text-xs", u.deleted_at && "text-destructive font-medium line-through")}>
          {u.lastname}
        </span>
      ),
    },
    {
      key: "telefono",
      header: "Teléfono",
      accessor: (u) => u.phone,
      className: "max-w-32",
      resizable: true,
      width: 150,
      edit: { onSave: (c, v) => saveField(c, "phone", String(v)) },
      render: (_, u) => (
        <span className={cn("flex items-center gap-1.5", u.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <Phone className="size-3.5" aria-hidden />
          <span className="font-mono text-xs">{u.phone || "-"}</span>
        </span>
      ),
    },
    {
      key: "direccion",
      header: "Dirección",
      accessor: (u) => u.address,
      className: "max-w-48",
      resizable: true,
      width: 200,
      edit: { onSave: (c, v) => saveField(c, "address", String(v)) },
      render: (_, u) => (
        <span className={cn("flex items-center gap-1.5", u.deleted_at ? "text-destructive/80" : "text-muted-foreground")}>
          <MapPin className="size-3.5" aria-hidden />
          <span className="truncate text-xs">{u.address || "-"}</span>
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
          if (!can("restore clients")) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(u)}
                title="Restaurar cliente"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        if (!can("edit clients") && !can("delete clients")) {
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
                    aria-label={`Acciones para ${u.firstname} ${u.lastname}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can("edit clients") && (
                  <DropdownMenuItem onClick={() => openEdit(u)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                {can("delete clients") && (
                  <DropdownMenuItem
                    variant="destructive"
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra la información de tus clientes y su estado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can("delete clients") && selectedRows.length > 0 && (
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
          {can("create clients") && (
            <Button
              type="button"
              onClick={openCreate}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Cliente
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
        getRowClassName={(u) =>
          u.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por nombre, CI, NIT o teléfono…"
        emptyMessage="No se encontraron clientes."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="clientes.csv"
        onExport={can("export clients") ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(u) => u.id}
        onSelectionChange={can("delete clients") ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={true}
        onRowReorder={handleRowReorder}
        persistPreferences={true}
        storageKey="clientes-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar cliente?"
        description={
          <>
            Se eliminará el cliente <strong>{deleteTarget?.firstname} {deleteTarget?.lastname}</strong> y
            todos sus datos asociados.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Cliente eliminado.");
          refresh();
        }}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} cliente(s)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} cliente(s) seleccionado(s)</strong> y
            todos sus datos asociados.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((u) => u.id),
          );
          toast.success(result.message);
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
