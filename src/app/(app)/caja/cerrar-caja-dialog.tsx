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
import { cerrarCaja, type CierreResultado } from "@/lib/api/caja";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import type { Caja } from "@/lib/types";

interface CerrarCajaDialogProps {
  caja: Caja | null;
  esperado: number;
  onOpenChange: (open: boolean) => void;
  onClosed: (resultado: CierreResultado) => void;
}

function CerrarCajaBody({
  caja,
  esperado,
  onOpenChange,
  onClosed,
}: {
  caja: Caja;
  esperado: number;
  onOpenChange: (open: boolean) => void;
  onClosed: (resultado: CierreResultado) => void;
}) {
  const [montoContado, setMontoContado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const valorContado = Number(montoContado);
  const diferencia = Number.isFinite(valorContado) && montoContado !== "" ? valorContado - esperado : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!Number.isFinite(valorContado) || valorContado < 0) {
      setError("Ingresa el monto contado (0 o mayor).");
      return;
    }

    setSaving(true);
    try {
      const resultado = await cerrarCaja(caja.id_caja, valorContado);
      onClosed(resultado);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cerrar la caja.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cerrar caja</DialogTitle>
        <DialogDescription>
          Monto esperado en caja: <strong>{formatCurrency(esperado)}</strong>. Cuenta el efectivo físico e
          ingresa el total.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="monto_cierre">Monto contado (Bs)</Label>
          <NumericInput
            id="monto_cierre"
            allowDecimal
            value={montoContado}
            onValueChange={setMontoContado}
            disabled={saving}
            autoFocus
          />
        </div>

        {diferencia !== null ? (
          <p
            className={
              "text-sm font-medium " +
              (diferencia === 0
                ? "text-muted-foreground"
                : diferencia > 0
                  ? "text-warning"
                  : "text-destructive")
            }
          >
            {diferencia === 0
              ? "Cuadra exacto con lo esperado."
              : diferencia > 0
                ? `Sobrante de ${formatCurrency(diferencia)}.`
                : `Faltante de ${formatCurrency(Math.abs(diferencia))}.`}
          </p>
        ) : null}

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
                Cerrando…
              </>
            ) : (
              "Cerrar caja"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CerrarCajaDialog({ caja, esperado, onOpenChange, onClosed }: CerrarCajaDialogProps) {
  return (
    <Dialog open={Boolean(caja)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {caja ? (
          <CerrarCajaBody key={caja.id_caja} caja={caja} esperado={esperado} onOpenChange={onOpenChange} onClosed={onClosed} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
