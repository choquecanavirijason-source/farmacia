"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  deleteProveedor,
  fetchProveedoresPage,
  updateProveedor,
} from "@/lib/api/proveedores";
import type { Proveedor } from "@/lib/types";
import { ProveedorFormDialog } from "@/app/(app)/proveedores/proveedor-form-dialog";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<{
    items: Proveedor[];
    total: number;
  }>({ items: [], total: 0 });
  const [params, setParams] = useState<ServerFetchParams>({
    page: 1,
    pageSize: 10,
    search: "",
    sort: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proveedor | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProveedoresPage(params, controller.signal)
      .then(setProveedores)
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Error al cargar los proveedores.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [params]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(proveedor: Proveedor) {
    setEditing(proveedor);
    setFormOpen(true);
  }

  function upsertProveedor(saved: Proveedor) {
    setProveedores((prev) => {
      const exists = prev.items.some(
        (p) => p.id_proveedor === saved.id_proveedor,
      );
      return {
        ...prev,
        items: exists
          ? prev.items.map((p) =>
              p.id_proveedor === saved.id_proveedor ? saved : p,
            )
          : [...prev.items, saved],
      };
    });
  }

  function handleSaved(saved: Proveedor) {
    const wasEditing = Boolean(editing);
    upsertProveedor(saved);
    toast.success(wasEditing ? "Proveedor actualizado." : "Proveedor creado.");
  }

  async function saveField(
    p: Proveedor,
    field: "nombre" | "nit" | "telefono" | "email",
    value: string,
  ) {
    const updated = await updateProveedor(p.id_proveedor, {
      nombre: field === "nombre" ? value : p.nombre,
      nit: field === "nit" ? value : p.nit,
      telefono: field === "telefono" ? value : p.telefono,
      direccion: p.direccion,
      email: field === "email" ? value : p.email,
    });
    upsertProveedor(updated);
  }

  const isLoading = loading;
  const hasAny = proveedores.items.length > 0;

  const columns: DataTableColumn<Proveedor>[] = [
    {
      key: "nombre",
      header: "Nombre",
      accessor: (p) => p.nombre,
      className: "max-w-56 truncate font-medium",
      edit: { onSave: (p, value) => saveField(p, "nombre", String(value)) },
    },
    {
      key: "nit",
      header: "NIT",
      accessor: (p) => p.nit,
      className: "whitespace-nowrap font-mono text-xs",
      edit: { onSave: (p, value) => saveField(p, "nit", String(value)) },
    },
    {
      key: "telefono",
      header: "Teléfono",
      accessor: (p) => p.telefono,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, p) => p.telefono || "—",
      edit: { onSave: (p, value) => saveField(p, "telefono", String(value)) },
    },
    {
      key: "email",
      header: "Correo",
      accessor: (p) => p.email,
      className: "max-w-48 truncate text-muted-foreground",
      render: (_, p) => p.email || "—",
      edit: { onSave: (p, value) => saveField(p, "email", String(value)) },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, p) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Acciones para ${p.nombre}`}
              />
            }
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(p)}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteTarget(p)}
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Gestión de Proveedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Proveedores de medicamentos para Registro de Compras.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0 gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nuevo Proveedor
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !hasAny ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Aún no hay proveedores registrados
              </p>
              <p className="max-w-sm text-xs text-balance text-muted-foreground">
                Registra tu primer proveedor para empezar a comprarle
                medicamentos.
              </p>
            </div>
            <Button type="button" onClick={openCreate} className="mt-2 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nuevo Proveedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={proveedores.items}
          columns={columns}
          server={{
            params,
            onParamsChange: (next) => {
              setLoading(true);
              setParams(next);
            },
            total: proveedores.total,
            loading,
            error,
            onRetry: () => {
              setLoading(true);
              setParams({ ...params });
            },
          }}
          searchPlaceholder="Buscar por nombre o NIT…"
          emptyMessage="No se encontraron proveedores."
        />
      )}

      <ProveedorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proveedor={editing}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar proveedor?"
        description={
          <>
            Se eliminará <strong>{deleteTarget?.nombre}</strong> del catálogo.
            Esta acción no se puede deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteProveedor(deleteTarget.id_proveedor);
          setProveedores((prev) => ({
            ...prev,
            items: prev.items.filter(
              (p) => p.id_proveedor !== deleteTarget.id_proveedor,
            ),
          }));
          toast.success("Proveedor eliminado.");
        }}
      />
    </div>
  );
}
