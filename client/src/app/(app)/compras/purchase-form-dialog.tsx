"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { SearchableSelect } from "@/components/ui/combobox";
import { registrarCompra } from "@/lib/api/purchases";
import { formatCurrency } from "@/lib/format";
import type { Compra, Medicamento, Proveedor } from "@/lib/types";

interface PurchaseItemRow {
  id_medicamento: number;
  cantidad: number;
  precio_unitario: number;
  numero_lote: string;
  fecha_vencimiento: string;
}

interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedores: Proveedor[];
  medicamentos: Medicamento[];
  onCompraRegistrada: (compra: Compra) => void;
}

const EMPTY_ROW: PurchaseItemRow = {
  id_medicamento: 0,
  cantidad: 1,
  precio_unitario: 0,
  numero_lote: "",
  fecha_vencimiento: "",
};

export function PurchaseFormDialog({
  open,
  onOpenChange,
  proveedores,
  medicamentos,
  onCompraRegistrada,
}: PurchaseFormDialogProps) {
  const [idProveedor, setIdProveedor] = useState<string>("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaCompra, setFechaCompra] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<PurchaseItemRow[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIdProveedor(
        proveedores.length > 0
          ? String(proveedores[0].id_proveedor || proveedores[0].id)
          : ""
      );
      setNumeroFactura("");
      setFechaCompra(new Date().toISOString().slice(0, 10));
      setItems([{ ...EMPTY_ROW }]);
      setError(null);
    }
  }, [open, proveedores]);

  function handleItemChange(
    index: number,
    field: keyof PurchaseItemRow,
    value: string | number
  ) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalCalculado = items.reduce(
    (acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!idProveedor) {
      setError("Selecciona un proveedor.");
      return;
    }
    if (!numeroFactura.trim()) {
      setError("Ingresa el número de factura.");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto a la compra.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.id_medicamento) {
        setError(`Fila #${i + 1}: Selecciona un medicamento.`);
        return;
      }
      if (!it.numero_lote.trim()) {
        setError(`Fila #${i + 1}: Ingresa el número de lote.`);
        return;
      }
      if (!it.fecha_vencimiento) {
        setError(`Fila #${i + 1}: Ingresa la fecha de vencimiento.`);
        return;
      }
      if (Number(it.cantidad) <= 0) {
        setError(`Fila #${i + 1}: La cantidad debe ser mayor a 0.`);
        return;
      }
      if (Number(it.precio_unitario) <= 0) {
        setError(`Fila #${i + 1}: El precio unitario debe ser mayor a 0.`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const nuevaCompra = await registrarCompra({
        id_proveedor: Number(idProveedor),
        numero_factura: numeroFactura.trim(),
        fecha_compra: fechaCompra,
        items: items.map((it) => ({
          id_medicamento: Number(it.id_medicamento),
          cantidad: Number(it.cantidad),
          precio_unitario: Number(it.precio_unitario),
          numero_lote: it.numero_lote.trim(),
          fecha_vencimiento: it.fecha_vencimiento,
        })),
      });

      toast.success("Compra registrada con éxito.");
      onCompraRegistrada(nuevaCompra as Compra);
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al registrar la compra.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Compra</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la factura y los lotes adquiridos para actualizar el stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="id_proveedor">Proveedor *</Label>
              <SearchableSelect
                options={proveedores.map((p) => ({
                  value: String(p.id_proveedor || p.id),
                  label: p.nombre || p.name,
                  sublabel: p.nit ? `NIT: ${p.nit}` : undefined,
                }))}
                value={idProveedor}
                onValueChange={(val) => setIdProveedor(val || "")}
                placeholder="Selecciona proveedor…"
                searchPlaceholder="Buscar proveedor…"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="numero_factura">N° Factura / Comprobante *</Label>
              <Input
                id="numero_factura"
                placeholder="Ej. FAC-10293"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha_compra">Fecha de Compra *</Label>
              <Input
                id="fecha_compra"
                type="date"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border rounded-lg p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                Medicamentos & Lotes
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={addItem}
              >
                <Plus className="size-3.5" />
                Agregar Medicamento
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-2 bg-muted/40 rounded-md border"
                >
                  <div className="sm:col-span-4 flex flex-col gap-1">
                    <Label className="text-[11px]">Medicamento</Label>
                    <SearchableSelect
                      options={medicamentos.map((m) => ({
                        value: String(m.id_medicamento || m.id),
                        label: m.nombre || m.name,
                        sublabel: m.codigo || m.code ? `Código: ${m.codigo || m.code}` : undefined,
                      }))}
                      value={it.id_medicamento ? String(it.id_medicamento) : undefined}
                      onValueChange={(val) =>
                        handleItemChange(idx, "id_medicamento", Number(val || 0))
                      }
                      placeholder="Selecciona…"
                      searchPlaceholder="Buscar medicamento…"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-[11px]">N° Lote</Label>
                    <Input
                      className="h-9 text-xs"
                      placeholder="LOT-123"
                      value={it.numero_lote}
                      onChange={(e) =>
                        handleItemChange(idx, "numero_lote", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-[11px]">Vencimiento</Label>
                    <Input
                      className="h-9 text-xs"
                      type="date"
                      value={it.fecha_vencimiento}
                      onChange={(e) =>
                        handleItemChange(idx, "fecha_vencimiento", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-1 flex flex-col gap-1">
                    <Label className="text-[11px]">Cant</Label>
                    <Input
                      className="h-9 text-xs"
                      type="number"
                      min={1}
                      value={it.cantidad}
                      onChange={(e) =>
                        handleItemChange(idx, "cantidad", Number(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-[11px]">P. Compra</Label>
                    <Input
                      className="h-9 text-xs"
                      type="number"
                      step="0.01"
                      min={0.01}
                      value={it.precio_unitario}
                      onChange={(e) =>
                        handleItemChange(idx, "precio_unitario", Number(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-center pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={items.length === 1}
                      onClick={() => removeItem(idx)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t text-sm font-semibold">
              Total Compra:{" "}
              <span className="ml-2 text-primary font-mono">
                {formatCurrency(totalCalculado)}
              </span>
            </div>
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
              {loading ? "Guardando…" : "Guardar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Alias de compatibilidad
export const CompraFormDialog = PurchaseFormDialog;
