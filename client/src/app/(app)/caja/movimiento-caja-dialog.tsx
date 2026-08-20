"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { registrarMovimiento } from "@/lib/api/caja";
import { ApiError } from "@/lib/api/client";
import type { MovimientoCaja, MovimientoCajaTipo } from "@/lib/types";

interface MovimientoCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idCaja: number;
  tipoInicial: MovimientoCajaTipo;
  onRegistrado: (movimiento: MovimientoCaja) => void;
}

function MovimientoCajaBody({
  onOpenChange,
  idCaja,
  tipoInicial,
  onRegistrado,
}: Omit<MovimientoCajaDialogProps, "open">) {
  const [tipo, setTipo] = useState<MovimientoCajaTipo>(tipoInicial);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    if (!concepto.trim()) {
      setError("El concepto es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const movimiento = await registrarMovimiento(idCaja, tipo, valor, concepto);
      onRegistrado(movimiento);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar movimiento</DialogTitle>
        <DialogDescription>Ingresos y egresos de efectivo fuera de una venta.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as MovimientoCajaTipo)} disabled={saving}>
            <SelectTrigger id="tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ingreso">Ingreso</SelectItem>
              <SelectItem value="egreso">Egreso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="monto">Monto (Bs)</Label>
          <NumericInput
            id="monto"
            allowDecimal
            value={monto}
            onValueChange={setMonto}
            disabled={saving}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            placeholder="Ej. Pago de delivery, compra de insumos…"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
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
            ) : (
              "Registrar"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function MovimientoCajaDialog({
  open,
  onOpenChange,
  idCaja,
  tipoInicial,
  onRegistrado,
}: MovimientoCajaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open ? (
          <MovimientoCajaBody
            key={tipoInicial}
            onOpenChange={onOpenChange}
            idCaja={idCaja}
            tipoInicial={tipoInicial}
            onRegistrado={onRegistrado}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
