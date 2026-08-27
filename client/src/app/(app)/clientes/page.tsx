"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Contact, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteCliente, fetchClientes, updateCliente } from "@/lib/api/clientes";
import type { Cliente } from "@/lib/types";
import { ClienteFormDialog } from "@/app/(app)/clientes/cliente-form-dialog";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  useEffect(() => {
    fetchClientes().then(setClientes);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setFormOpen(true);
  }

  function upsertCliente(saved: Cliente) {
    setClientes((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((c) => c.id_cliente === saved.id_cliente);
      return exists
        ? prev.map((c) => (c.id_cliente === saved.id_cliente ? saved : c))
        : [...prev, saved];
    });
  }

  function handleSaved(saved: Cliente) {
    const wasEditing = Boolean(editing);
    upsertCliente(saved);
    toast.success(wasEditing ? "Cliente actualizado." : "Cliente creado.");
  }

  async function saveField(c: Cliente, field: "nombre" | "ci_nit" | "telefono" | "direccion", value: string) {
    const updated = await updateCliente(c.id_cliente, {
      nombre: field === "nombre" ? value : c.nombre,
      ci_nit: field === "ci_nit" ? value : c.ci_nit,
      telefono: field === "telefono" ? value : c.telefono,
      direccion: field === "direccion" ? value : c.direccion,
    });
    upsertCliente(updated);
  }

  const isLoading = clientes === null;
  const hasAny = (clientes?.length ?? 0) > 0;

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: "nombre",
      header: "Nombre",
      accessor: (c) => c.nombre,
      className: "max-w-56 truncate font-medium",
      edit: { onSave: (c, value) => saveField(c, "nombre", String(value)) },
    },
    {
      key: "ci_nit",
      header: "CI/NIT",
      accessor: (c) => c.ci_nit,
      className: "whitespace-nowrap font-mono text-xs",
      edit: { onSave: (c, value) => saveField(c, "ci_nit", String(value)) },
    },
    {
      key: "telefono",
      header: "Teléfono",
      accessor: (c) => c.telefono,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, c) => c.telefono || "—",
      edit: { onSave: (c, value) => saveField(c, "telefono", String(value)) },
    },
    {
      key: "direccion",
      header: "Dirección",
      accessor: (c) => c.direccion,
      className: "max-w-56 truncate text-muted-foreground",
      render: (_, c) => c.direccion || "—",
      edit: { onSave: (c, value) => saveField(c, "direccion", String(value)) },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, c) => {
        const esGenerico = c.id_cliente === 1;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${c.nombre}`} />}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openEdit(c)}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" disabled={esGenerico} onSelect={() => setDeleteTarget(c)}>
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Clientes</h1>
          <p className="text-sm text-muted-foreground">Clientes disponibles para asociar a una venta.</p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0 gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nuevo Cliente
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CI/NIT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
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
              <Contact className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">Aún no hay clientes registrados</p>
            <Button type="button" onClick={openCreate} className="mt-2 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nuevo Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={clientes ?? []}
          columns={columns}
          searchPlaceholder="Buscar por nombre o CI/NIT…"
          emptyMessage="No se encontraron clientes."
        />
      )}

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
            Se eliminará <strong>{deleteTarget?.nombre}</strong> del catálogo. Esta acción no se puede
            deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCliente(deleteTarget.id_cliente);
          setClientes((prev) =>
            prev ? prev.filter((c) => c.id_cliente !== deleteTarget.id_cliente) : prev
          );
          toast.success("Cliente eliminado.");
        }}
      />
    </div>
  );
}
