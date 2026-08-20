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
import { createPresentacion, updatePresentacion, type PresentacionInput } from "@/lib/api/catalogos";
import { ApiError } from "@/lib/api/client";
import type { Presentacion } from "@/lib/types";

interface PresentacionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentacion?: Presentacion | null;
  onSaved: (presentacion: Presentacion) => void;
}

interface FormState {
  nombre: string;
  descripcion: string;
}

function PresentacionFormBody({
  onOpenChange,
  presentacion,
  onSaved,
}: Omit<PresentacionFormDialogProps, "open">) {
  const isEditing = Boolean(presentacion);
  const [form, setForm] = useState<FormState>(() => ({
    nombre: presentacion?.nombre ?? "",
    descripcion: presentacion?.descripcion ?? "",
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

    const input: PresentacionInput = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
    };

    setSaving(true);
    try {
      const saved = presentacion
        ? await updatePresentacion(presentacion.id_presentacion, input)
        : await createPresentacion(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la presentación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar presentación" : "Nueva presentación"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Actualiza los datos de la presentación."
            : "Agrega una presentación al catálogo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            placeholder="Tableta, Jarabe, Ampolla…"
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
              "Crear presentación"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function PresentacionFormDialog({
  open,
  onOpenChange,
  ...bodyProps
}: PresentacionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <PresentacionFormBody
            key={bodyProps.presentacion?.id_presentacion ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
