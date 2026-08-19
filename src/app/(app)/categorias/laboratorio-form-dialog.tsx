"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createLaboratorio, updateLaboratorio, type LaboratorioInput } from "@/lib/api/catalogos";
import { ApiError } from "@/lib/api/client";
import type { Laboratorio } from "@/lib/types";

interface LaboratorioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratorio?: Laboratorio | null;
  onSaved: (laboratorio: Laboratorio) => void;
}

interface FormState {
  nombre: string;
  pais: string;
  telefono: string;
}

function LaboratorioFormBody({
  onOpenChange,
  laboratorio,
  onSaved,
}: Omit<LaboratorioFormDialogProps, "open">) {
  const isEditing = Boolean(laboratorio);
  const [form, setForm] = useState<FormState>(() => ({
    nombre: laboratorio?.nombre ?? "",
    pais: laboratorio?.pais ?? "",
    telefono: laboratorio?.telefono ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.nombre.trim() || !form.pais.trim()) {
      setError("Nombre y país son obligatorios.");
      return;
    }

    const input: LaboratorioInput = {
      nombre: form.nombre.trim(),
      pais: form.pais.trim(),
      telefono: form.telefono.trim(),
    };

    setSaving(true);
    try {
      const saved = laboratorio
        ? await updateLaboratorio(laboratorio.id_laboratorio, input)
        : await createLaboratorio(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el laboratorio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar laboratorio" : "Nuevo laboratorio"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Actualiza los datos del laboratorio." : "Agrega un laboratorio al catálogo."}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pais">País</Label>
            <Input
              id="pais"
              value={form.pais}
              onChange={(e) => setForm((prev) => ({ ...prev, pais: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <NumericInput
              id="telefono"
              value={form.telefono}
              onValueChange={(v) => setForm((prev) => ({ ...prev, telefono: v }))}
              disabled={saving}
            />
          </div>
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
              "Crear laboratorio"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function LaboratorioFormDialog({
  open,
  onOpenChange,
  ...bodyProps
}: LaboratorioFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <LaboratorioFormBody
            key={bodyProps.laboratorio?.id_laboratorio ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
