"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { deleteCategoria, fetchCategorias } from "@/lib/api/catalogos";
import type { Categoria } from "@/lib/types";
import { CategoriaFormDialog } from "@/app/(app)/categorias/categoria-form-dialog";

export function CategoriaSection() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null);

  useEffect(() => {
    fetchCategorias().then(setCategorias);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(categoria: Categoria) {
    setEditing(categoria);
    setFormOpen(true);
  }

  function handleSaved(saved: Categoria) {
    const wasEditing = Boolean(editing);
    setCategorias((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((c) => c.id_categoria === saved.id_categoria);
      return exists
        ? prev.map((c) => (c.id_categoria === saved.id_categoria ? saved : c))
        : [...prev, saved];
    });
    toast.success(wasEditing ? "Categoría actualizada." : "Categoría creada.");
  }

  const isLoading = categorias === null;
  const hasItems = (categorias?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nueva Categoría
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
              <Tags className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">Aún no hay categorías registradas</p>
            <Button type="button" onClick={openCreate} className="mt-1 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nueva Categoría
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
              {categorias?.map((c) => (
                <TableRow key={c.id_categoria}>
                  <TableCell className="max-w-40 truncate font-medium" title={c.nombre}>
                    {c.nombre}
                  </TableCell>
                  <TableCell className="max-w-80 truncate text-muted-foreground" title={c.descripcion}>
                    {c.descripcion || "—"}
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
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(c)}>
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

      <CategoriaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categoria={editing}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar categoría?"
        description={
          <>
            Se eliminará <strong>{deleteTarget?.nombre}</strong> del catálogo. Esta acción no se puede
            deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCategoria(deleteTarget.id_categoria);
          setCategorias((prev) =>
            prev ? prev.filter((c) => c.id_categoria !== deleteTarget.id_categoria) : prev
          );
          toast.success("Categoría eliminada.");
        }}
      />
    </div>
  );
}
