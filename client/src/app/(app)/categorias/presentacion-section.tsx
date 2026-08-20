"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Boxes, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { deletePresentacion, fetchPresentaciones } from "@/lib/api/catalogos";
import type { Presentacion } from "@/lib/types";
import { PresentacionFormDialog } from "@/app/(app)/categorias/presentacion-form-dialog";

export function PresentacionSection() {
  const [presentaciones, setPresentaciones] = useState<Presentacion[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Presentacion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Presentacion | null>(null);

  useEffect(() => {
    fetchPresentaciones().then(setPresentaciones);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(presentacion: Presentacion) {
    setEditing(presentacion);
    setFormOpen(true);
  }

  function handleSaved(saved: Presentacion) {
    const wasEditing = Boolean(editing);
    setPresentaciones((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((p) => p.id_presentacion === saved.id_presentacion);
      return exists
        ? prev.map((p) => (p.id_presentacion === saved.id_presentacion ? saved : p))
        : [...prev, saved];
    });
    toast.success(wasEditing ? "Presentación actualizada." : "Presentación creada.");
  }

  const isLoading = presentaciones === null;
  const hasItems = (presentaciones?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nueva Presentación
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
              <Boxes className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">Aún no hay presentaciones registradas</p>
            <Button type="button" onClick={openCreate} className="mt-1 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nueva Presentación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentaciones?.map((p) => (
                <TableRow key={p.id_presentacion}>
                  <TableCell className="max-w-40 truncate font-medium" title={p.nombre}>
                    {p.nombre}
                  </TableCell>
                  <TableCell className="max-w-80 truncate text-muted-foreground" title={p.descripcion}>
                    {p.descripcion || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${p.nombre}`} />
                        }
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(p)}>
                          <Pencil className="size-4" aria-hidden />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(p)}>
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

      <PresentacionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        presentacion={editing}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar presentación?"
        description={
          <>
            Se eliminará <strong>{deleteTarget?.nombre}</strong> del catálogo. Esta acción no se puede
            deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deletePresentacion(deleteTarget.id_presentacion);
          setPresentaciones((prev) =>
            prev ? prev.filter((p) => p.id_presentacion !== deleteTarget.id_presentacion) : prev
          );
          toast.success("Presentación eliminada.");
        }}
      />
    </div>
  );
}
