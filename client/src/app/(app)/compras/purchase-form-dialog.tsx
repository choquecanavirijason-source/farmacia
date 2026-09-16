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
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { fetchProveedores } from "@/lib/api/suppliers";
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
  proveedores?: Proveedor[];
  medicamentos?: Medicamento[];
  onCompraRegistrada: (compra: Compra) => void;
}

const EMPTY_ROW: PurchaseItemRow = {
  id_medicamento: 0,
  cantidad: 1,
  precio_unitario: 0,
  numero_lote: "",
  fecha_vencimiento: "",
};

// Componente modal para registrar una compra. Envuelve el formulario en un componente aparte
// (con `key`) para que cada apertura sea un montaje nuevo — así el formulario arranca limpio
// sin necesitar un efecto que "resetee" campos manualmente cuando `open` cambia.
export function PurchaseFormDialog(props: PurchaseFormDialogProps) {
  if (!props.open) return null;

  return <PurchaseFormBody key="purchase-form" {...props} />;
}

function PurchaseFormBody({
  open,
  onOpenChange,
  proveedores: initialProveedores,
  medicamentos: initialMedicamentos,
  onCompraRegistrada,
}: PurchaseFormDialogProps) {
  const [fetchedProveedores, setFetchedProveedores] = useState<Proveedor[] | null>(null);
  const [fetchedMedicamentos, setFetchedMedicamentos] = useState<Medicamento[] | null>(null);
  const proveedores =
    initialProveedores && initialProveedores.length > 0 ? initialProveedores : fetchedProveedores ?? [];
  const medicamentos =
    initialMedicamentos && initialMedicamentos.length > 0 ? initialMedicamentos : fetchedMedicamentos ?? [];

  const [idProveedor, setIdProveedor] = useState<string>("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaCompra, setFechaCompra] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<PurchaseItemRow[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trae los catálogos solo si no vinieron por props (una sola vez: el diálogo remonta en cada apertura).
  useEffect(() => {
    if (!initialProveedores || initialProveedores.length === 0) {
      fetchProveedores().then(setFetchedProveedores).catch(() => setFetchedProveedores([]));
    }
    if (!initialMedicamentos || initialMedicamentos.length === 0) {
      fetchMedicamentos().then(setFetchedMedicamentos).catch(() => setFetchedMedicamentos([]));
    }
  }, [initialProveedores, initialMedicamentos]);

  // Derivado en render (no en efecto): mientras el usuario no elija, cae al primer proveedor disponible.
  const selectedIdProveedor =
    idProveedor || (proveedores[0] ? String(proveedores[0].id_proveedor || proveedores[0].id) : "");

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

    if (!selectedIdProveedor) {
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
      if (!it.cantidad || it.cantidad <= 0) {
        setError(`Fila #${i + 1}: La cantidad debe ser mayor a 0.`);
        return;
      }
      if (!it.precio_unitario || it.precio_unitario < 0) {
        setError(`Fila #${i + 1}: El costo unitario es inválido.`);
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
    }

    setLoading(true);
    setError(null);

    try {
      const result = await registrarCompra({
        id_proveedor: Number(selectedIdProveedor),
        numero_factura: numeroFactura.trim(),
        fecha_compra: fechaCompra,
        items: items.map((it) => ({
          id_medicamento: it.id_medicamento,
          cantidad: Number(it.cantidad),
          precio_unitario: Number(it.precio_unitario),
          numero_lote: it.numero_lote.trim(),
          fecha_vencimiento: it.fecha_vencimiento,
        })),
      });

      onCompraRegistrada({
        ...result,
        id_compra: result.id,
        id_proveedor: result.supplier_id,
        numero_factura: result.invoice_number,
        fecha_compra: result.purchase_date,
        total: Number(result.total),
      });
      onOpenChange(false);
    } catch (err) {
      const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      const msg = axiosMessage || (err instanceof Error ? err.message : undefined) || "No se pudo registrar la compra.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const proveedorOptions = proveedores.map((p) => ({
    value: String(p.id_proveedor || p.id),
    label: p.nombre || p.name,
    sublabel: p.nit ? `NIT: ${p.nit}` : undefined,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Registrar Nueva Compra</DialogTitle>
          <DialogDescription>
            Ingresa la información de la compra de medicamentos a proveedores y generación de lotes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="id_proveedor">Proveedor *</Label>
                <SearchableSelect
                  options={proveedorOptions}
                  value={selectedIdProveedor}
                  onValueChange={(val) => setIdProveedor(val || "")}
                  placeholder="Selecciona un proveedor…"
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
                      <Label className="text-[11px]">Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) =>
                          handleItemChange(idx, "cantidad", parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-xs"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <Label className="text-[11px]">Costo Unit. (Bs)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.precio_unitario}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "precio_unitario",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-xs"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <Label className="text-[11px]">Lote</Label>
                      <Input
                        placeholder="Lote..."
                        value={it.numero_lote}
                        onChange={(e) =>
                          handleItemChange(idx, "numero_lote", e.target.value)
                        }
                        className="h-8 text-xs"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <Label className="text-[11px]">Vencimiento</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={it.fecha_vencimiento}
                          onChange={(e) =>
                            handleItemChange(idx, "fecha_vencimiento", e.target.value)
                          }
                          className="h-8 text-xs"
                          required
                        />
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive h-8 w-8 shrink-0"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center px-2 py-1 bg-muted/20 border rounded-lg">
              <span className="text-sm font-semibold">Total Estimado de la Compra:</span>
              <span className="text-base font-bold font-mono text-primary">
                {formatCurrency(totalCalculado)}
              </span>
            </div>
          </div>

          <DialogFooter className="p-4 border-t gap-2 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando…" : "Registrar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const RegistrarCompraDialog = PurchaseFormDialog;
