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
import { fetchBranches } from "@/lib/api/branches";
import type { IBatch } from "@/lib/types/batch";
import type { IBranch } from "@/lib/types/branch";

interface TransferBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: IBatch | null;
  nombreMedicamento: string;
  onConfirm: (toBranchId: number, cantidad: number, motivo?: string) => Promise<void>;
}

export function TransferBatchDialog({
  open,
  onOpenChange,
  batch,
  nombreMedicamento,
  onConfirm,
}: TransferBatchDialogProps) {
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [toBranchId, setToBranchId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockActual = batch?.current_quantity ?? 0;
  const numCantidad = Number(cantidad);
  const destinos = branches.filter((b) => b.id !== batch?.branch_id);

  useEffect(() => {
    if (open) {
      fetchBranches().then(setBranches).catch(() => setBranches([]));
      setToBranchId("");
      setCantidad("1");
      setMotivo("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batch]);

  useEffect(() => {
    if (!toBranchId && destinos.length > 0) {
      setToBranchId(String(destinos[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!batch) return;

    if (!toBranchId) {
      setError("Selecciona la sucursal de destino.");
      return;
    }
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
      await onConfirm(Number(toBranchId), numCantidad, motivo.trim() || undefined);
      onOpenChange(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Ocurrió un error al registrar el traspaso."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Traspasar stock a otra sucursal</DialogTitle>
          <DialogDescription>
            {nombreMedicamento} — Lote <strong>{batch?.batch_number}</strong> (Stock:{" "}
            {stockActual} uds)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="transfer_to_branch">Sucursal de destino</Label>
            <Select
              value={toBranchId}
              onValueChange={(v) => setToBranchId(v ?? "")}
              items={destinos.map((b) => ({ value: String(b.id), label: b.name }))}
            >
              <SelectTrigger id="transfer_to_branch" className="w-full">
                <SelectValue placeholder="Selecciona una sucursal…" />
              </SelectTrigger>
              <SelectContent>
                {destinos.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="transfer_cantidad">Cantidad a traspasar</Label>
            <Input
              id="transfer_cantidad"
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
            <Label htmlFor="transfer_motivo">Motivo (opcional)</Label>
            <Textarea
              id="transfer_motivo"
              placeholder="Ej. Reabastecimiento por alta demanda…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
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
            <Button type="submit" disabled={loading || destinos.length === 0}>
              {loading ? "Procesando…" : "Confirmar traspaso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
