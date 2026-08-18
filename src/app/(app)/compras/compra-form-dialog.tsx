"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { createCompra, type CompraInput, type CompraItemInput } from "@/lib/api/compras";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import type { Compra, Medicamento, Proveedor } from "@/lib/types";

interface CompraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedores: Proveedor[];
  medicamentos: Medicamento[];
  onSaved: (compra: Compra) => void;
}

interface ItemRow {
  tempId: number;
  id_medicamento: string;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad: string;
  precio_unitario: string;
}

let tempIdSeq = 0;
function emptyRow(): ItemRow {
  tempIdSeq += 1;
  return {
    tempId: tempIdSeq,
    id_medicamento: "",
    numero_lote: "",
    fecha_vencimiento: "",
    cantidad: "",
    precio_unitario: "",
  };
}

function rowSubtotal(row: ItemRow): number {
  const cantidad = Number(row.cantidad);
  const precio = Number(row.precio_unitario);
  if (!Number.isFinite(cantidad) || !Number.isFinite(precio)) return 0;
  return cantidad * precio;
}

function CompraFormBody({
  onOpenChange,
  proveedores,
  medicamentos,
  onSaved,
}: Omit<CompraFormDialogProps, "open">) {
  const [idProveedor, setIdProveedor] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemRow[]>(() => [emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((sum, row) => sum + rowSubtotal(row), 0);

  function updateRow(tempId: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row) => (row.tempId === tempId ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  function removeRow(tempId: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.tempId !== tempId) : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!idProveedor || !numeroFactura.trim() || !fecha) {
      setError("Completa proveedor, número de factura y fecha.");
      return;
    }

    const parsedItems: CompraItemInput[] = [];
    for (const row of items) {
      if (!row.id_medicamento || !row.numero_lote.trim() || !row.fecha_vencimiento) {
        setError("Cada línea necesita medicamento, N° de lote y fecha de vencimiento.");
        return;
      }
      const cantidad = Number(row.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        setError("La cantidad de cada línea debe ser un entero mayor a 0.");
        return;
      }
      const precio = Number(row.precio_unitario);
      if (!Number.isFinite(precio) || precio <= 0) {
        setError("El precio unitario de cada línea debe ser mayor a 0.");
        return;
      }
      parsedItems.push({
        id_medicamento: Number(row.id_medicamento),
        numero_lote: row.numero_lote.trim(),
        fecha_vencimiento: row.fecha_vencimiento,
        cantidad,
        precio_unitario: precio,
      });
    }

    const input: CompraInput = {
      id_proveedor: Number(idProveedor),
      numero_factura: numeroFactura.trim(),
      fecha,
      items: parsedItems,
    };

    setSaving(true);
    try {
      const saved = await createCompra(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la compra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva compra</DialogTitle>
        <DialogDescription>
          Cada línea crea un lote nuevo y aumenta el stock del medicamento correspondiente.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="id_proveedor">Proveedor</Label>
            <Select value={idProveedor} onValueChange={(v) => setIdProveedor(v ?? "")} disabled={saving}>
              <SelectTrigger id="id_proveedor" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id_proveedor} value={String(p.id_proveedor)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="numero_factura">N° de factura</Label>
            <Input
              id="numero_factura"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Medicamentos</p>
            <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={saving} className="gap-1.5">
              <Plus className="size-4" aria-hidden />
              Agregar línea
            </Button>
          </div>

          {items.map((row, index) => (
            <div key={row.tempId} className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Línea {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={saving || items.length === 1}
                  onClick={() => removeRow(row.tempId)}
                  aria-label={`Quitar línea ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor={`medicamento-${row.tempId}`}>Medicamento</Label>
                <Select
                  value={row.id_medicamento}
                  onValueChange={(v) => updateRow(row.tempId, { id_medicamento: v ?? "" })}
                  disabled={saving}
                >
                  <SelectTrigger id={`medicamento-${row.tempId}`} className="w-full">
                    <SelectValue placeholder="Selecciona un medicamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicamentos.map((m) => (
                      <SelectItem key={m.id_medicamento} value={String(m.id_medicamento)}>
                        {m.nombre} ({m.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`numero_lote-${row.tempId}`}>N° de lote</Label>
                  <Input
                    id={`numero_lote-${row.tempId}`}
                    value={row.numero_lote}
                    onChange={(e) => updateRow(row.tempId, { numero_lote: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`fecha_vencimiento-${row.tempId}`}>Fecha de vencimiento</Label>
                  <Input
                    id={`fecha_vencimiento-${row.tempId}`}
                    type="date"
                    value={row.fecha_vencimiento}
                    onChange={(e) => updateRow(row.tempId, { fecha_vencimiento: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`cantidad-${row.tempId}`}>Cantidad</Label>
                  <Input
                    id={`cantidad-${row.tempId}`}
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={row.cantidad}
                    onChange={(e) => updateRow(row.tempId, { cantidad: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`precio_unitario-${row.tempId}`}>Precio unitario (Bs)</Label>
                  <Input
                    id={`precio_unitario-${row.tempId}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={row.precio_unitario}
                    onChange={(e) => updateRow(row.tempId, { precio_unitario: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Subtotal</Label>
                  <p className="flex h-8 items-center text-sm font-medium tabular-nums">
                    {formatCurrency(rowSubtotal(row))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total de la compra</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</p>
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
                Registrando…
              </>
            ) : (
              "Registrar compra"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CompraFormDialog({ open, onOpenChange, ...bodyProps }: CompraFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {open ? <CompraFormBody key="compra-form" onOpenChange={onOpenChange} {...bodyProps} /> : null}
      </DialogContent>
    </Dialog>
  );
}
