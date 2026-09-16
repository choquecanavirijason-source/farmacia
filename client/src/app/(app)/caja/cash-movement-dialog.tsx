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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registrarMovimiento } from "@/lib/api/cash-registers";
import type { MovimientoCaja, MovimientoCajaTipo } from "@/lib/types";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idCaja: number;
  onMovimientoRegistrado: (movimiento: MovimientoCaja) => void;
  initialTipo?: MovimientoCajaTipo;
}

export function CashMovementDialog({
  open,
  onOpenChange,
  idCaja,
  onMovimientoRegistrado,
  initialTipo = "egreso",
}: CashMovementDialogProps) {
  const [tipo, setTipo] = useState<MovimientoCajaTipo>(initialTipo);
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTipo(initialTipo);
      setMonto("");
      setMotivo("");
      setError(null);
    }
  }, [open, initialTipo]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numMonto = Number(monto);

    if (isNaN(numMonto) || numMonto <= 0) {
      setError("El monto debe ser un número positivo.");
      return;
    }
    if (!motivo.trim()) {
      setError("Ingresa el concepto o motivo del movimiento.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nuevoMov = await registrarMovimiento(idCaja, {
        tipo: (tipo === "in" || tipo === "ingreso" ? "ingreso" : "egreso"),
        monto: numMonto,
        motivo: motivo.trim(),
      });
      toast.success("Movimiento registrado con éxito.");
      onMovimientoRegistrado(nuevoMov as any);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error al registrar el movimiento.";
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
          <DialogTitle>Registrar Movimiento de Efectivo</DialogTitle>
          <DialogDescription>
            Registra una entrada manual o retiro de dinero en efectivo de la caja actual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo">Tipo de Movimiento</Label>
            <Select value={tipo} onValueChange={(val) => setTipo(val as MovimientoCajaTipo)}>
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="egreso">Egreso / Retiro de dinero</SelectItem>
                <SelectItem value="ingreso">Ingreso / Entrada manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="monto_mov">Monto (Bs) *</Label>
            <NumericInput
              id="monto_mov"
              allowDecimal
              value={monto}
              onValueChange={(val) => {
                setMonto(val);
                setError(null);
              }}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo_mov">Concepto / Motivo *</Label>
            <Input
              id="motivo_mov"
              placeholder="Ej. Pago a mensajero, cambio inicial, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
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
              {loading ? "Guardando…" : "Registrar Movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Alias de compatibilidad
export const MovimientoCajaDialog = CashMovementDialog;
