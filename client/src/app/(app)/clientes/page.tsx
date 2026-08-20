"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Contact, MoreHorizontal, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteCliente, fetchClientes } from "@/lib/api/clientes";
import type { Cliente } from "@/lib/types";
import { ClienteFormDialog } from "@/app/(app)/clientes/cliente-form-dialog";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  useEffect(() => {
    fetchClientes().then(setClientes);
  }, []);

  const filtered = useMemo(() => {
    if (!clientes) return null;
    const query = search.trim().toLowerCase();
    if (!query) return clientes;
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(query) || c.ci_nit.toLowerCase().includes(query)
    );
  }, [clientes, search]);

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
    setClientes((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((c) => c.id_cliente === saved.id_cliente);
      return exists
        ? prev.map((c) => (c.id_cliente === saved.id_cliente ? saved : c))
        : [...prev, saved];
    });
    toast.success(wasEditing ? "Cliente actualizado." : "Cliente creado.");
  }

  const isLoading = clientes === null;
  const hasAny = (clientes?.length ?? 0) > 0;
  const hasResults = (filtered?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Clientes</h1>
        <p className="text-sm text-muted-foreground">Clientes disponibles para asociar a una venta.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o CI/NIT…"
            className="pl-8"
            aria-label="Buscar clientes"
          />
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
      ) : !hasResults ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="max-w-sm text-xs text-balance text-muted-foreground">
              No encontramos clientes para “{search}”.
            </p>
            <Button type="button" variant="outline" onClick={() => setSearch("")} className="mt-2">
              Limpiar búsqueda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CI/NIT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((c) => {
                const esGenerico = c.id_cliente === 1;
                return (
                  <TableRow key={c.id_cliente}>
                    <TableCell className="max-w-56 truncate font-medium" title={c.nombre}>
                      {c.nombre}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{c.ci_nit}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {c.telefono || "—"}
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground" title={c.direccion}>
                      {c.direccion || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${c.nombre}`} />
                          }
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(c)}>
                            <Pencil className="size-4" aria-hidden />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={esGenerico}
                            onSelect={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
