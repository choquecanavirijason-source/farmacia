"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCategoria, updateCategoria, type CategoriaInput } from "@/lib/api/catalogos";
import { ApiError } from "@/lib/api/client";
import type { Categoria } from "@/lib/types";

interface CategoriaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: Categoria | null;
  onSaved: (categoria: Categoria) => void;
}

interface FormState {
  nombre: string;
  descripcion: string;
}

function CategoriaFormBody({
  onOpenChange,
  categoria,
  onSaved,
}: Omit<CategoriaFormDialogProps, "open">) {
  const isEditing = Boolean(categoria);
  const [form, setForm] = useState<FormState>(() => ({
    nombre: categoria?.nombre ?? "",
    descripcion: categoria?.descripcion ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const input: CategoriaInput = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
    };

    setSaving(true);
    try {
      const saved = categoria
        ? await updateCategoria(categoria.id_categoria, input)
        : await createCategoria(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Actualiza los datos de la categoría." : "Agrega una categoría al catálogo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            disabled={saving}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            value={form.descripcion}
            onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            disabled={saving}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm wrap-break-word text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Guardando…
              </>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Crear categoría"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CategoriaFormDialog({ open, onOpenChange, ...bodyProps }: CategoriaFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <CategoriaFormBody
            key={bodyProps.categoria?.id_categoria ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
