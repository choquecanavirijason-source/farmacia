"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOTIVOS_AJUSTE, type Lote, type MotivoAjuste } from "@/lib/types";

interface DisposeBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lote: Lote | null;
  nombreMedicamento: string;
  onConfirm: (cantidad: number, motivo: MotivoAjuste, notas?: string) => Promise<void>;
}

export function DisposeBatchDialog({
  open,
  onOpenChange,
  lote,
  nombreMedicamento,
  onConfirm,
}: DisposeBatchDialogProps) {
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState<MotivoAjuste>("Vencimiento");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockActual = lote?.cantidad_actual ?? 0;
  const numCantidad = Number(cantidad);
  const isDirty = cantidad !== "1" || motivo !== "Vencimiento" || notas !== "";

  useEffect(() => {
    if (open) {
      setCantidad("1");
      setMotivo("Vencimiento");
      setNotas("");
      setError(null);
    }
  }, [open, lote]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isDirty && !loading) {
      if (!window.confirm("Tienes cambios sin guardar. ¿Cerrar de todas formas?")) {
        return;
      }
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lote) return;

    if (!Number.isInteger(numCantidad) || numCantidad < 1) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return;
    }
    if (numCantidad > stockActual) {
      setError(`La cantidad no puede superar el stock actual del lote (${stockActual} uds).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(numCantidad, motivo, notas.trim() || undefined);
      onOpenChange(false);
    } catch {
      setError("Ocurrió un error al registrar la baja.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dar de baja unidades del lote</DialogTitle>
          <DialogDescription>
            {nombreMedicamento} — Lote <strong>{lote?.numero_lote}</strong> (Stock:{" "}
            {stockActual} uds)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cantidad_baja">Cantidad a descontar</Label>
            <Input
              id="cantidad_baja"
              type="number"
              min={1}
              max={stockActual}
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value);
                setError(null);
              }}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo_baja">Motivo</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoAjuste)}>
              <SelectTrigger id="motivo_baja" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_AJUSTE.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas_baja">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas_baja"
              placeholder="Detalles sobre el estado del producto, acta de destrucción, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Procesando…" : "Confirmar baja"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Alias de compatibilidad
export const DarDeBajaDialog = DisposeBatchDialog;
