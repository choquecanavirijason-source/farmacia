"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { abrirCaja } from "@/lib/api/cash-registers";
import type { Caja } from "@/lib/types";

interface OpenCashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idUsuario: number;
  onCajaAbierta: (caja: Caja) => void;
}

export function OpenCashRegisterDialog({
  open,
  onOpenChange,
  idUsuario,
  onCajaAbierta,
}: OpenCashRegisterDialogProps) {
  const [montoApertura, setMontoApertura] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMontoApertura("0");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const monto = Number(montoApertura);

    if (isNaN(monto) || monto < 0) {
      setError("El monto de apertura no puede ser negativo.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nuevaCaja = await abrirCaja({
        id_usuario: idUsuario,
        monto_apertura: monto,
      });
      toast.success("Caja abierta correctamente.");
      onCajaAbierta(nuevaCaja as any);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error al abrir la caja.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
          <DialogDescription>
            Ingresa el monto de dinero en efectivo con el que se inicia el turno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="monto_apertura">Monto inicial en caja (Bs)</Label>
            <NumericInput
              id="monto_apertura"
              allowDecimal
              value={montoApertura}
              onValueChange={(val) => {
                setMontoApertura(val);
                setError(null);
              }}
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Abriendo…" : "Confirmar Apertura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Alias de compatibilidad
export const AbrirCajaDialog = OpenCashRegisterDialog;
