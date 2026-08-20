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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { darDeBajaLote } from "@/lib/api/lotes";
import { ApiError } from "@/lib/api/client";
import { MOTIVOS_AJUSTE, type Lote, type MotivoAjuste } from "@/lib/types";

interface DarDeBajaDialogProps {
  lote: Lote | null;
  onOpenChange: (open: boolean) => void;
  onAdjusted: (lote: Lote) => void;
}

function DarDeBajaBody({
  lote,
  onOpenChange,
  onAdjusted,
}: {
  lote: Lote;
  onOpenChange: (open: boolean) => void;
  onAdjusted: (lote: Lote) => void;
}) {
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState<MotivoAjuste | "">("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cant = Number(cantidad);
    if (!Number.isInteger(cant) || cant <= 0) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return;
    }
    if (cant > lote.cantidad_actual) {
      setError(`No puede superar el stock actual (${lote.cantidad_actual}).`);
      return;
    }
    if (!motivo) {
      setError("Selecciona un motivo.");
      return;
    }

    setSaving(true);
    try {
      const actualizado = await darDeBajaLote(lote.id_lote, cant, motivo);
      onAdjusted(actualizado);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo dar de baja el stock.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Dar de baja stock</DialogTitle>
        <DialogDescription>
          Lote <strong>{lote.numero_lote}</strong> — stock actual: {lote.cantidad_actual}.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cantidad">Cantidad a dar de baja</Label>
          <NumericInput
            id="cantidad"
            value={cantidad}
            onValueChange={setCantidad}
            disabled={saving}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo">Motivo</Label>
          <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoAjuste)} disabled={saving}>
            <SelectTrigger id="motivo" className="w-full">
              <SelectValue placeholder="Selecciona un motivo" />
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

        {error ? (
          <p role="alert" className="text-sm wrap-break-word text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="submit" variant="destructive" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Guardando…
              </>
            ) : (
              "Dar de baja"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function DarDeBajaDialog({ lote, onOpenChange, onAdjusted }: DarDeBajaDialogProps) {
  return (
    <Dialog open={Boolean(lote)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {lote ? (
          <DarDeBajaBody key={lote.id_lote} lote={lote} onOpenChange={onOpenChange} onAdjusted={onAdjusted} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
