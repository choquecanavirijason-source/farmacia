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
import { createCliente, updateCliente, type ClienteInput } from "@/lib/api/clientes";
import { ApiError } from "@/lib/api/client";
import type { Cliente } from "@/lib/types";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSaved: (cliente: Cliente) => void;
}

interface FormState {
  nombre: string;
  ci_nit: string;
  telefono: string;
  direccion: string;
}

function ClienteFormBody({
  onOpenChange,
  cliente,
  onSaved,
}: Omit<ClienteFormDialogProps, "open">) {
  const isEditing = Boolean(cliente);
  const [form, setForm] = useState<FormState>(() => ({
    nombre: cliente?.nombre ?? "",
    ci_nit: cliente?.ci_nit ?? "",
    telefono: cliente?.telefono ?? "",
    direccion: cliente?.direccion ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.nombre.trim() || !form.ci_nit.trim()) {
      setError("Nombre y CI/NIT son obligatorios.");
      return;
    }

    const input: ClienteInput = {
      nombre: form.nombre.trim(),
      ci_nit: form.ci_nit.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
    };

    setSaving(true);
    try {
      const saved = cliente
        ? await updateCliente(cliente.id_cliente, input)
        : await createCliente(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Actualiza los datos del cliente." : "Registra un cliente nuevo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ci_nit">CI / NIT</Label>
            <Input
              id="ci_nit"
              value={form.ci_nit}
              onChange={(e) => update("ci_nit", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={form.telefono}
            onChange={(e) => update("telefono", e.target.value)}
            disabled={saving}
          />
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
              "Crear cliente"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ClienteFormDialog({ open, onOpenChange, ...bodyProps }: ClienteFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <ClienteFormBody
            key={bodyProps.cliente?.id_cliente ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
