"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { abrirCaja } from "@/lib/api/caja";
import { ApiError } from "@/lib/api/client";
import type { Caja } from "@/lib/types";

interface AbrirCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpened: (caja: Caja) => void;
}

function AbrirCajaBody({
  onOpenChange,
  onOpened,
}: Omit<AbrirCajaDialogProps, "open">) {
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor < 0) {
      setError("Ingresa un monto válido (0 o mayor).");
      return;
    }

    setSaving(true);
    try {
      const caja = await abrirCaja(valor);
      onOpened(caja);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo abrir la caja.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Abrir caja</DialogTitle>
        <DialogDescription>Registra el monto en efectivo con el que empiezas el turno.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="monto_apertura">Monto inicial (Bs)</Label>
          <NumericInput
            id="monto_apertura"
            allowDecimal
            value={monto}
            onValueChange={setMonto}
            disabled={saving}
            autoFocus
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
                Abriendo…
              </>
            ) : (
              "Abrir caja"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function AbrirCajaDialog({ open, onOpenChange, onOpened }: AbrirCajaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open ? <AbrirCajaBody key="abrir-caja" onOpenChange={onOpenChange} onOpened={onOpened} /> : null}
      </DialogContent>
    </Dialog>
  );
}
