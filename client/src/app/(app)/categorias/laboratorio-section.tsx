"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteLaboratorio, fetchLaboratorios } from "@/lib/api/catalogos";
import type { Laboratorio } from "@/lib/types";
import { LaboratorioFormDialog } from "@/app/(app)/categorias/laboratorio-form-dialog";

export function LaboratorioSection() {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Laboratorio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Laboratorio | null>(null);

  useEffect(() => {
    fetchLaboratorios().then(setLaboratorios);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(laboratorio: Laboratorio) {
    setEditing(laboratorio);
    setFormOpen(true);
  }

  function handleSaved(saved: Laboratorio) {
    const wasEditing = Boolean(editing);
    setLaboratorios((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((l) => l.id_laboratorio === saved.id_laboratorio);
      return exists
        ? prev.map((l) => (l.id_laboratorio === saved.id_laboratorio ? saved : l))
        : [...prev, saved];
    });
    toast.success(wasEditing ? "Laboratorio actualizado." : "Laboratorio creado.");
  }

  const isLoading = laboratorios === null;
  const hasItems = (laboratorios?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nuevo Laboratorio
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !hasItems ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">Aún no hay laboratorios registrados</p>
            <Button type="button" onClick={openCreate} className="mt-1 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nuevo Laboratorio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laboratorios?.map((l) => (
                <TableRow key={l.id_laboratorio}>
                  <TableCell className="max-w-40 truncate font-medium" title={l.nombre}>
                    {l.nombre}
                  </TableCell>
                  <TableCell className="max-w-32 truncate text-muted-foreground" title={l.pais}>
                    {l.pais}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {l.telefono || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${l.nombre}`} />
                        }
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(l)}>
                          <Pencil className="size-4" aria-hidden />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(l)}>
                          <Trash2 className="size-4" aria-hidden />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LaboratorioFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        laboratorio={editing}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar laboratorio?"
        description={
          <>
            Se eliminará <strong>{deleteTarget?.nombre}</strong> del catálogo. Esta acción no se puede
            deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteLaboratorio(deleteTarget.id_laboratorio);
          setLaboratorios((prev) =>
            prev ? prev.filter((l) => l.id_laboratorio !== deleteTarget.id_laboratorio) : prev
          );
          toast.success("Laboratorio eliminado.");
        }}
      />
    </div>
  );
}
