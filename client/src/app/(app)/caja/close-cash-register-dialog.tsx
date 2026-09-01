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
import { cerrarCaja } from "@/lib/api/cash-registers";
import { formatCurrency } from "@/lib/format";
import type { Caja } from "@/lib/types";

interface CloseCashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caja: Caja | null;
  totalEsperado: number;
  onCajaCerrada: (caja: Caja) => void;
}

export function CloseCashRegisterDialog({
  open,
  onOpenChange,
  caja,
  totalEsperado,
  onCajaCerrada,
}: CloseCashRegisterDialogProps) {
  const [montoCierre, setMontoCierre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMontoCierre(totalEsperado.toString());
      setError(null);
    }
  }, [open, totalEsperado]);

  if (!open) return null;

  const numCierre = Number(montoCierre);
  const diferencia = numCierre - totalEsperado;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caja) return;

    if (isNaN(numCierre) || numCierre < 0) {
      setError("Ingresa un monto válido mayor o igual a 0.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cajaCerrada = await cerrarCaja(caja.id_caja || caja.id, {
        monto_cierre: numCierre,
      });
      toast.success("Caja cerrada correctamente.");
      onCajaCerrada(cajaCerrada as any);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error al cerrar la caja.";
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
          <DialogTitle>Cerrar Turno de Caja</DialogTitle>
          <DialogDescription>
            Realiza el arqueo final e ingresa el monto total en efectivo recaudado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto de Apertura:</span>
              <span className="font-mono font-medium">{formatCurrency(Number(caja?.monto_apertura || caja?.opening_amount || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Efectivo Esperado en Sistema:</span>
              <span className="font-mono font-semibold text-primary">{formatCurrency(totalEsperado)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="monto_cierre">Monto contado en efectivo (Arqueo real)</Label>
            <NumericInput
              id="monto_cierre"
              allowDecimal
              value={montoCierre}
              onValueChange={(val) => {
                setMontoCierre(val);
                setError(null);
              }}
              autoFocus
            />
          </div>

          {Number.isFinite(numCierre) && (
            <div className="text-xs flex justify-between p-2 rounded bg-muted/30 border">
              <span>Diferencia (Sobrante / Faltante):</span>
              <span
                className={`font-mono font-bold ${
                  diferencia === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : diferencia > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-destructive"
                }`}
              >
                {diferencia > 0 ? `+${formatCurrency(diferencia)} (Sobrante)` : diferencia < 0 ? `${formatCurrency(diferencia)} (Faltante)` : "Exacto ($0.00)"}
              </span>
            </div>
          )}

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
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Cerrando…" : "Confirmar Cierre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Alias de compatibilidad
export const CerrarCajaDialog = CloseCashRegisterDialog;
