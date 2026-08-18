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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLote, updateLote, type LoteInput } from "@/lib/api/lotes";
import { ApiError } from "@/lib/api/client";
import type { Lote, Medicamento } from "@/lib/types";

interface LoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lote?: Lote | null;
  medicamentos: Medicamento[];
  onSaved: (lote: Lote) => void;
}

interface FormState {
  id_medicamento: string;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad_actual: string;
  precio_compra: string;
}

function LoteFormBody({
  onOpenChange,
  lote,
  medicamentos,
  onSaved,
}: Omit<LoteFormDialogProps, "open">) {
  const isEditing = Boolean(lote);
  const [form, setForm] = useState<FormState>(() => ({
    id_medicamento: lote ? String(lote.id_medicamento) : "",
    numero_lote: lote?.numero_lote ?? "",
    fecha_vencimiento: lote?.fecha_vencimiento ?? "",
    cantidad_actual: lote ? String(lote.cantidad_actual) : "",
    precio_compra: lote ? String(lote.precio_compra) : "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.id_medicamento || !form.numero_lote.trim() || !form.fecha_vencimiento) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    const precio = Number(form.precio_compra);
    if (!Number.isFinite(precio) || precio <= 0) {
      setError("El precio de compra debe ser un número mayor a 0.");
      return;
    }

    const input: LoteInput = {
      numero_lote: form.numero_lote.trim(),
      fecha_vencimiento: form.fecha_vencimiento,
      precio_compra: precio,
      id_medicamento: Number(form.id_medicamento),
    };

    setSaving(true);
    try {
      let saved: Lote;
      if (lote) {
        saved = await updateLote(lote.id_lote, input);
      } else {
        const cantidad = Number(form.cantidad_actual);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          setError("La cantidad inicial debe ser un número entero mayor a 0.");
          setSaving(false);
          return;
        }
        saved = await createLote({ ...input, cantidad_actual: cantidad });
      }
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el lote.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar lote" : "Nuevo lote"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Actualiza los datos del lote. El stock se ajusta desde “Dar de baja”."
            : "Registra un lote nuevo con su stock inicial."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="id_medicamento">Medicamento</Label>
          <Select
            value={form.id_medicamento}
            onValueChange={(value) => update("id_medicamento", value as string)}
            disabled={saving || isEditing}
          >
            <SelectTrigger id="id_medicamento" className="w-full">
              <SelectValue placeholder="Selecciona un medicamento" />
            </SelectTrigger>
            <SelectContent>
              {medicamentos.map((m) => (
                <SelectItem key={m.id_medicamento} value={String(m.id_medicamento)}>
                  {m.nombre} ({m.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="numero_lote">N° de lote</Label>
            <Input
              id="numero_lote"
              value={form.numero_lote}
              onChange={(e) => update("numero_lote", e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha_vencimiento">Fecha de vencimiento</Label>
            <Input
              id="fecha_vencimiento"
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => update("fecha_vencimiento", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isEditing ? null : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cantidad_actual">Cantidad inicial</Label>
              <Input
                id="cantidad_actual"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.cantidad_actual}
                onChange={(e) => update("cantidad_actual", e.target.value)}
                disabled={saving}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="precio_compra">Precio de compra (Bs)</Label>
            <Input
              id="precio_compra"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.precio_compra}
              onChange={(e) => update("precio_compra", e.target.value)}
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
              "Crear lote"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function LoteFormDialog({ open, onOpenChange, ...bodyProps }: LoteFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <LoteFormBody key={bodyProps.lote?.id_lote ?? "new"} onOpenChange={onOpenChange} {...bodyProps} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
