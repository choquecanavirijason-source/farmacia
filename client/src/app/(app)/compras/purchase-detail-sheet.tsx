"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchPurchaseDetails } from "@/lib/api/purchases";
import { formatCurrency } from "@/lib/format";
import type { Compra, DetalleCompra, Medicamento, Proveedor } from "@/lib/types";

interface PurchaseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: Compra | null;
  proveedores: Proveedor[];
  medicamentos: Medicamento[];
}

export function PurchaseDetailSheet({
  open,
  onOpenChange,
  compra,
  proveedores,
  medicamentos,
}: PurchaseDetailSheetProps) {
  const [details, setDetails] = useState<DetalleCompra[]>([]);
  const [loading, setLoading] = useState(false);

  const proveedor = proveedores.find(
    (p) => (p.id_proveedor || p.id) === (compra?.id_proveedor || (compra as any)?.supplier_id)
  );

  const medById = new Map(
    medicamentos.map((m) => [m.id_medicamento || m.id, m.nombre || m.name])
  );

  useEffect(() => {
    if (!open || !compra) return;
    setLoading(true);
    fetchPurchaseDetails(compra.id_compra || compra.id)
      .then((data) => setDetails(data as any))
      .catch(() => setDetails([]))
      .finally(() => setLoading(false));
  }, [open, compra]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalle de Compra #{compra?.id_compra || compra?.id}</SheetTitle>
          <SheetDescription>
            Factura: <strong>{compra?.numero_factura || (compra as any)?.invoice_number}</strong> — Proveedor:{" "}
            <strong>{proveedor?.nombre || proveedor?.name || "Sin proveedor"}</strong>
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4 text-xs">
            <div className="border rounded-lg p-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-muted-foreground font-semibold">
                    <th className="py-1.5">Medicamento</th>
                    <th className="py-1.5">Cant</th>
                    <th className="py-1.5 text-right">P. Unit</th>
                    <th className="py-1.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {details.map((d, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-medium">
                        {d.medicament?.name || medById.get(d.id_medicamento || (d as any).medicament_id) || `Item #${d.id_medicamento || idx + 1}`}
                      </td>
                      <td className="py-1.5 font-mono">{d.cantidad || (d as any).quantity}</td>
                      <td className="py-1.5 text-right font-mono">
                        {formatCurrency(Number(d.precio_unitario || (d as any).unit_price))}
                      </td>
                      <td className="py-1.5 text-right font-mono font-semibold">
                        {formatCurrency(Number(d.subtotal || (d as any).subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t">
              <span>Total Comprado</span>
              <span className="font-mono text-primary">
                {formatCurrency(Number(compra?.total || 0))}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Alias de compatibilidad
export const DetalleCompraSheet = PurchaseDetailSheet;
