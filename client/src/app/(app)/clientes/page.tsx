"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn, type ServerFetchParams } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteCliente, deleteClientes, fetchClientesPage } from "@/lib/api/clientes";
import { ApiError } from "@/lib/api/client";
import type { Cliente } from "@/lib/types";
import { ClienteFormDialog } from "@/app/(app)/clientes/cliente-form-dialog";

const DEFAULT_PARAMS: ServerFetchParams = { page: 1, pageSize: 10, search: "", sort: null };

export default function ClientesPage() {
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [query, setQuery] = useState<{ items: Cliente[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [selectedRows, setSelectedRows] = useState<Cliente[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectionClearKey, setSelectionClearKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);

      fetchClientesPage(params, controller.signal)
        .then((result) => {
          setQuery(result);
          setError(null);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setError(err instanceof ApiError ? err.message : "Error al cargar los clientes.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, params.search ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [params, refreshKey]);

  // Tras borrar la última fila de la última página, retrocede una página.
  useEffect(() => {
    if (!loading && !error && query.items.length === 0 && query.total > 0 && params.page > 1) {
      setParams((p) => ({ ...p, page: p.page - 1 }));
    }
  }, [loading, error, query, params.page]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setFormOpen(true);
  }

  function handleSaved(saved: Cliente) {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Cliente actualizado." : "Cliente creado.");
    refresh();
  }

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: "nombre",
      header: "Nombre",
      accessor: (u) => u.nombre,
      className: "min-w-32 max-w-48",
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
      render: (_, u) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          <span className="truncate text-xs">{u.direccion || "-"}</span>
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (u) => u.estado,
      render: (_, u) => (
        <Badge variant={u.estado === "activo" ? "success" : "secondary"}>
          {u.estado === "activo" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "fecha_registro",
      header: "Registro",
      accessor: (u) => u.fecha_registro,
      className: "whitespace-nowrap text-muted-foreground text-xs",
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, u) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${u.nombre}`}>
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(u)}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(u)}>
              <Trash2 className="size-4" aria-hidden />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Clientes</h1>
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
          <Button type="button" onClick={openCreate} className="shrink-0 gap-1.5">
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
          onParamsChange: setParams,
          total: query.total,
          loading,
          error,
          onRetry: refresh,
        }}
        searchPlaceholder="Buscar por nombre, teléfono o email…"
        emptyMessage="No se encontraron clientes."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="clientes.csv"
        getRowId={(u) => u.id_cliente}
        onSelectionChange={setSelectedRows}
        clearSelectionKey={selectionClearKey}
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
            Se eliminará el cliente <strong>{deleteTarget?.nombre}</strong> y todos sus datos asociados.
            Esta acción no se puede deshacer.
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
            Se eliminarán <strong>{selectedRows.length} cliente(s) seleccionado(s)</strong> y todos sus datos
            asociados. Esta acción no se puede deshacer.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await deleteClientes(selectedRows.map((u) => u.id_cliente));
          toast.success(result.message);
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
