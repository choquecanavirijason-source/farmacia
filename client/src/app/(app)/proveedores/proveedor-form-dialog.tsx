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
import { createProveedor, updateProveedor, type ProveedorInput } from "@/lib/api/proveedores";
import { ApiError } from "@/lib/api/client";
import type { Proveedor } from "@/lib/types";

interface ProveedorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor | null;
  onSaved: (proveedor: Proveedor) => void;
}

interface FormState {
  nombre: string;
  nit: string;
  telefono: string;
  direccion: string;
  email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProveedorFormBody({
  onOpenChange,
  proveedor,
  onSaved,
}: Omit<ProveedorFormDialogProps, "open">) {
  const isEditing = Boolean(proveedor);
  const [form, setForm] = useState<FormState>(() => ({
    nombre: proveedor?.nombre ?? "",
    nit: proveedor?.nit ?? "",
    telefono: proveedor?.telefono ?? "",
    direccion: proveedor?.direccion ?? "",
    email: proveedor?.email ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.nombre.trim() || !form.nit.trim()) {
      setError("Nombre y NIT son obligatorios.");
      return;
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      setError("El correo electrónico no es válido.");
      return;
    }

    const input: ProveedorInput = {
      nombre: form.nombre.trim(),
      nit: form.nit.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      email: form.email.trim(),
    };

    setSaving(true);
    try {
      const saved = proveedor
        ? await updateProveedor(proveedor.id_proveedor, input)
        : await createProveedor(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el proveedor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Actualiza los datos del proveedor." : "Registra un proveedor nuevo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre / Razón social</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nit">NIT</Label>
            <NumericInput
              id="nit"
              value={form.nit}
              onValueChange={(v) => update("nit", v)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <NumericInput
              id="telefono"
              value={form.telefono}
              onValueChange={(v) => update("telefono", v)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            value={form.direccion}
            onChange={(e) => update("direccion", e.target.value)}
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
              "Crear proveedor"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ProveedorFormDialog({ open, onOpenChange, ...bodyProps }: ProveedorFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <ProveedorFormBody
            key={bodyProps.proveedor?.id_proveedor ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
