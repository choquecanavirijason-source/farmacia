"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteLaboratorio, fetchLaboratorios, updateLaboratorio } from "@/lib/api/catalogos";
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

  function upsertLaboratorio(saved: Laboratorio) {
    setLaboratorios((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((l) => l.id_laboratorio === saved.id_laboratorio);
      return exists
        ? prev.map((l) => (l.id_laboratorio === saved.id_laboratorio ? saved : l))
        : [...prev, saved];
    });
  }

  function handleSaved(saved: Laboratorio) {
    const wasEditing = Boolean(editing);
    upsertLaboratorio(saved);
    toast.success(wasEditing ? "Laboratorio actualizado." : "Laboratorio creado.");
  }

  async function saveField(l: Laboratorio, field: "nombre" | "pais" | "telefono", value: string) {
    const updated = await updateLaboratorio(l.id_laboratorio, {
      nombre: field === "nombre" ? value : l.nombre,
      pais: field === "pais" ? value : l.pais,
      telefono: field === "telefono" ? value : l.telefono,
    });
    upsertLaboratorio(updated);
  }

  const isLoading = laboratorios === null;
  const hasItems = (laboratorios?.length ?? 0) > 0;

  const columns: DataTableColumn<Laboratorio>[] = [
    {
      key: "nombre",
      header: "Nombre",
      accessor: (l) => l.nombre,
      className: "max-w-40 truncate font-medium",
      edit: { onSave: (l, value) => saveField(l, "nombre", String(value)) },
    },
    {
      key: "pais",
      header: "País",
      accessor: (l) => l.pais,
      className: "max-w-32 truncate text-muted-foreground",
      edit: { onSave: (l, value) => saveField(l, "pais", String(value)) },
    },
    {
      key: "telefono",
      header: "Teléfono",
      accessor: (l) => l.telefono,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, l) => l.telefono || "—",
      edit: { onSave: (l, value) => saveField(l, "telefono", String(value)) },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, l) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${l.nombre}`} />}
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
      ),
    },
  ];

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
        <DataTable
          data={laboratorios ?? []}
          columns={columns}
          searchPlaceholder="Buscar laboratorio…"
          emptyMessage="No se encontraron laboratorios."
        />
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
