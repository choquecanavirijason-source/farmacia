"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
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
  deleteCliente,
  deleteClientes,
  exportClientes,
  fetchClientesPage,
  updateCliente,
} from "@/lib/api/clientes";
import { ApiError } from "@/lib/api/client";
import type { Cliente } from "@/lib/types";
import { ClienteFormDialog } from "@/app/(app)/clientes/cliente-form-dialog";

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

export default function ClientesPage() {
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [query, setQuery] = useState<{ items: Cliente[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [selectedRows, setSelectedRows] = useState<Cliente[]>([]);
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

    fetchClientesPage(params, controller.signal)
      .then((result) => {
        setQuery(result);
        setError(null);
        if (result.items.length === 0 && result.total > 0 && params.page > 1) {
          setParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Error al cargar los clientes.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey]);

  const handleRowReorder = useCallback(async () => {
    // El orden en clientes es solo visual: se reinicia en search/sort/paginación.
    // Para modelos que sí persistan el orden, descomentar cuando exista el endpoint:
    // const ids = reorderedData.map((cliente) => cliente.id_cliente);
    // await updateClientesOrder(ids);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setFormOpen(true);
  }

  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Cliente actualizado." : "Cliente creado.");
    refresh();
  }

  async function saveField(
    cliente: Cliente,
    field: "nombre" | "ci_nit" | "telefono" | "direccion",
    value: string,
  ) {
    await updateCliente(cliente.id_cliente, {
      nombre: field === "nombre" ? value : cliente.nombre,
      ci_nit: field === "ci_nit" ? value : cliente.ci_nit,
      telefono: field === "telefono" ? value : cliente.telefono,
      direccion: field === "direccion" ? value : cliente.direccion,
    });
    refresh();
  }

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: "ci_nit",
      header: "CI / NIT",
      accessor: (u) => u.ci_nit,
      className: "max-w-32",
      resizable: true,
      width: 130,
      edit: { onSave: (c, v) => saveField(c, "ci_nit", String(v)) },
      render: (_, u) => <span className="font-mono text-xs">{u.ci_nit}</span>,
    },
    {
      key: "nombre",
      header: "Nombre",
      accessor: (u) => u.nombre,
      className: "min-w-32 max-w-48",
      resizable: true,
      width: 200,
      edit: { onSave: (c, v) => saveField(c, "nombre", String(v)) },
      render: (_, u) => (
        <span className="block truncate font-medium" title={u.nombre}>
          {u.nombre}
        </span>
      ),
    },
    {
      key: "telefono",
      header: "Teléfono",
      accessor: (u) => u.telefono,
      className: "max-w-32",
      resizable: true,
      width: 150,
      edit: { onSave: (c, v) => saveField(c, "telefono", String(v)) },
      render: (_, u) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="size-3.5" aria-hidden />
          <span className="font-mono text-xs">{u.telefono || "-"}</span>
        </span>
      ),
    },
    {
      key: "direccion",
      header: "Dirección",
      accessor: (u) => u.direccion,
      className: "max-w-48",
      resizable: true,
      width: 200,
      edit: { onSave: (c, v) => saveField(c, "direccion", String(v)) },
      render: (_, u) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          <span className="truncate text-xs">{u.direccion || "-"}</span>
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
      render: (_, u) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Acciones para ${u.nombre}`}
                />
              }
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openEdit(u)}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(u)}
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
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
          {selectedRows.length > 0 && (
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
            onClick={openCreate}
            className="shrink-0 gap-1.5"
          >
            <Plus className="size-4" aria-hidden />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <DataTable
        data={query.items}
        columns={columns}
        server={{
          params,
          onParamsChange: handleParamsChange,
          total: query.total,
          loading,
          error,
          onRetry: refresh,
        }}
        searchPlaceholder="Buscar por nombre, CI/NIT o teléfono…"
        emptyMessage="No se encontraron clientes."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="clientes.csv"
        onExport={(formato) => exportClientes(formato, params)}
        getRowId={(u) => u.id_cliente}
        onSelectionChange={setSelectedRows}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={true}
        onRowReorder={handleRowReorder}
        persistPreferences={true}
        storageKey="clientes-table"
        minColumnWidth={80}
      />

      <ClienteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={editing}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar cliente?"
        description={
          <>
            Se eliminará el cliente <strong>{deleteTarget?.nombre}</strong> y
            todos sus datos asociados. Esta acción no se puede deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCliente(deleteTarget.id_cliente);
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
            todos sus datos asociados. Esta acción no se puede deshacer.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await deleteClientes(
            selectedRows.map((u) => u.id_cliente),
          );
          toast.success(result.message);
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
