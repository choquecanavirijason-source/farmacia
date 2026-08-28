"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
  deleteCategoria,
  fetchCategoriasPage,
  updateCategoria,
} from "@/lib/api/catalogos";
import type { Categoria } from "@/lib/types";
import { CategoriaFormDialog } from "@/app/(app)/categorias/categoria-form-dialog";

export function CategoriaSection() {
  const [categorias, setCategorias] = useState<{
    items: Categoria[];
    total: number;
  }>({ items: [], total: 0 });
  const [params, setParams] = useState<ServerFetchParams>({
    page: 1,
    pageSize: 10,
    search: "",
    sort: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategoriasPage(params, controller.signal)
      .then((result) => {
        setCategorias(result);
        setError(null);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Error al cargar las categorías.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [params, refreshKey]);

  function handleParamsChange(next: ServerFetchParams) {
    setLoading(true);
    setParams(next);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(categoria: Categoria) {
    setEditing(categoria);
    setFormOpen(true);
  }

  function upsertCategoria(saved: Categoria) {
    setCategorias((prev) => {
      const exists = prev.items.some(
        (c) => c.id_categoria === saved.id_categoria,
      );
      return {
        ...prev,
        items: exists
          ? prev.items.map((c) =>
              c.id_categoria === saved.id_categoria ? saved : c,
            )
          : [...prev.items, saved],
      };
    });
  }

  function handleSaved(saved: Categoria) {
    const wasEditing = Boolean(editing);
    upsertCategoria(saved);
    toast.success(wasEditing ? "Categoría actualizada." : "Categoría creada.");
  }

  async function saveField(
    c: Categoria,
    field: "nombre" | "descripcion",
    value: string,
  ) {
    const updated = await updateCategoria(c.id_categoria, {
      nombre: field === "nombre" ? value : c.nombre,
      descripcion: field === "descripcion" ? value : c.descripcion,
    });
    upsertCategoria(updated);
  }

  const isLoading = loading;
  const hasItems = categorias.items.length > 0;

  const columns: DataTableColumn<Categoria>[] = [
    {
      key: "nombre",
      header: "Nombre",
      accessor: (c) => c.nombre,
      className: "max-w-40 truncate font-medium",
      edit: { onSave: (c, value) => saveField(c, "nombre", String(value)) },
    },
    {
      key: "descripcion",
      header: "Descripción",
      accessor: (c) => c.descripcion,
      className: "max-w-80 truncate text-muted-foreground",
      render: (_, c) => c.descripcion || "—",
      edit: {
        onSave: (c, value) => saveField(c, "descripcion", String(value)),
      },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, c) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Acciones para ${c.nombre}`}
              />
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
              onSelect={() => setDeleteTarget(c)}
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
            <p className="text-sm font-medium">
              Aún no hay categorías registradas
            </p>
            <Button type="button" onClick={openCreate} className="mt-1 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nueva Categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={categorias.items}
          columns={columns}
          server={{
            params,
            onParamsChange: handleParamsChange,
            total: categorias.total,
            loading,
            error,
            onRetry: () => {
              setLoading(true);
              setRefreshKey((key) => key + 1);
            },
          }}
          searchPlaceholder="Buscar categoría…"
          emptyMessage="No se encontraron categorías."
        />
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
            Se eliminará <strong>{deleteTarget?.nombre}</strong> del catálogo.
            Esta acción no se puede deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCategoria(deleteTarget.id_categoria);
          setCategorias((prev) => ({
            ...prev,
            items: prev.items.filter(
              (c) => c.id_categoria !== deleteTarget.id_categoria,
            ),
          }));
          toast.success("Categoría eliminada.");
        }}
      />
    </div>
  );
}
