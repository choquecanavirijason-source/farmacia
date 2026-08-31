"use client";

import { useEffect, useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchInvoice } from "@/lib/api/sales";
import { fetchCompany } from "@/lib/api/companies";
import { formatCurrency } from "@/lib/format";
import type { ISale, IInvoice } from "@/lib/types/sale";
import type { ICompany } from "@/lib/types/company";

interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: ISale | null;
}

export function InvoiceSheet({ open, onOpenChange, sale }: InvoiceSheetProps) {
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sale) return;
    setLoading(true);

    Promise.all([
      fetchInvoice(sale.id).catch(() => null),
      fetchCompany().catch(() => null),
    ])
      .then(([inv, comp]) => {
        setInvoice(inv);
        setCompany(comp);
      })
      .finally(() => setLoading(false));
  }, [open, sale]);

  function handlePrint() {
    window.print();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col justify-between">
        <div>
          <SheetHeader>
            <SheetTitle>Factura de Venta</SheetTitle>
            <SheetDescription>Comprobante de venta y detalle de productos.</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sale ? (
            <div className="flex flex-col gap-4 p-4 mt-2 border rounded-lg bg-card text-xs">
              <div className="text-center pb-2 border-b">
                <p className="font-bold text-sm">{company?.name || "Farmacia San Rafael"}</p>
                <p className="text-muted-foreground">NIT: {company?.nit || "1028374029"}</p>
                <p className="text-muted-foreground">{company?.address || "Av. América #450"}</p>
              </div>

              <div className="flex justify-between">
                <span>N° Factura: <strong>{invoice?.invoice_number || `FAC-${sale.id.toString().padStart(6, "0")}`}</strong></span>
                <span>Fecha: <strong>{new Date(sale.sale_date || sale.created_at).toLocaleDateString("es-ES")}</strong></span>
              </div>

              <div className="flex justify-between">
                <span>Cliente: <strong>{sale.client ? `${sale.client.firstname} ${sale.client.lastname}` : (sale as any).nombre_cliente || "Sin nombre"}</strong></span>
                <span>NIT/CI: <strong>{invoice?.client_tax_id || sale.client?.nit || sale.client?.ci || "0"}</strong></span>
              </div>

              <div className="border-t pt-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground font-semibold">
                      <th className="py-1">Cant</th>
                      <th className="py-1">Detalle</th>
                      <th className="py-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sale.details || (sale as any).items || []).map((d: any, idx: number) => (
                      <tr key={idx} className="border-b/40">
                        <td className="py-1 font-mono">{d.quantity || d.cantidad}</td>
                        <td className="py-1">{d.medicament?.name || d.medicamento?.nombre || `Item #${d.medicament_id || idx + 1}`}</td>
                        <td className="py-1 text-right font-mono">{formatCurrency(Number(d.subtotal || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-sm border-t">
                <span>Total Cancelado</span>
                <span className="font-mono text-primary">{formatCurrency(Number(sale.total))}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" className="w-full gap-1.5" onClick={handlePrint} disabled={loading || !sale}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Alias de compatibilidad
export const FacturaSheet = InvoiceSheet;
