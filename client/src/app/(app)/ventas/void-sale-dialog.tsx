"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { voidSale } from "@/lib/api/sales";
import type { ISale } from "@/lib/types/sale";

interface VoidSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: ISale | null;
  onVoided?: () => void;
}

export function VoidSaleDialog({
  open,
  onOpenChange,
  sale,
  onVoided,
}: VoidSaleDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sale) return;

    if (!reason.trim()) {
      setError("Por favor ingresa un motivo para anular la venta.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await voidSale(sale.id, reason.trim());
      toast.success("Venta anulada con éxito.");
      onVoided?.();
      onOpenChange(false);
      setReason("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error al anular la venta.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>¿Anular venta #{sale?.id}?</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción devolverá automáticamente las unidades al stock del inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo de anulación *</Label>
            <Textarea
              id="motivo"
              placeholder="Ej. Devolución de cliente, error de cobro, etc."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              rows={3}
              required
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Anulando…
                </>
              ) : (
                "Confirmar anulación"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Alias de compatibilidad
export const AnularVentaDialog = VoidSaleDialog;
