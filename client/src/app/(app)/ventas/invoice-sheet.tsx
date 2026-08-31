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
import { fetchInvoice, fetchSale, fetchSaleDetails } from "@/lib/api/sales";
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
  const [fullSale, setFullSale] = useState<ISale | null>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sale) {
      setFullSale(null);
      setDetails([]);
      setInvoice(null);
      return;
    }

    setLoading(true);

    Promise.all([
      fetchSale(sale.id).catch(() => null),
      fetchSaleDetails(sale.id).catch(() => []),
      fetchInvoice(sale.id).catch(() => null),
      fetchCompany().catch(() => null),
    ])
      .then(([saleData, detailsData, inv, comp]) => {
        setFullSale(saleData || sale);
        const resolvedDetails = (saleData?.details && saleData.details.length > 0)
          ? saleData.details
          : (Array.isArray(detailsData) && detailsData.length > 0)
          ? detailsData
          : (sale.details || (sale as any).items || []);
        setDetails(resolvedDetails);
        setInvoice(inv || saleData?.invoice || null);
        setCompany(comp);
      })
      .finally(() => setLoading(false));
  }, [open, sale]);

  function handlePrint() {
    window.print();
  }

  const currentSale = fullSale || sale;
  const clientName = currentSale?.client
    ? `${currentSale.client.firstname ?? ""} ${currentSale.client.lastname ?? ""}`.trim()
    : (currentSale as any)?.razon_social || (currentSale as any)?.nombre_cliente || "Cliente General";

  const nitCi = invoice?.client_tax_id || currentSale?.client?.nit || currentSale?.client?.ci || (currentSale as any)?.nit_cliente || "0";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col justify-between overflow-y-auto">
        <div>
          <SheetHeader>
            <SheetTitle>Comprobante de Venta</SheetTitle>
            <SheetDescription>Detalle de productos y desglose del pago.</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : currentSale ? (
            <div className="flex flex-col gap-4 p-4 mt-2 border rounded-lg bg-card text-xs">
              <div className="text-center pb-2 border-b">
                <p className="font-bold text-sm">{company?.name || "Farmacia San Rafael"}</p>
                <p className="text-muted-foreground">NIT: {company?.nit || "1028374029"}</p>
                <p className="text-muted-foreground">{company?.address || "Av. Heroínas #324, Cochabamba"}</p>
                {company?.phone && <p className="text-muted-foreground">Tel: {company.phone}</p>}
              </div>

              <div className="flex justify-between">
                <span>N° Factura: <strong>{invoice?.invoice_number || `FAC-${currentSale.id.toString().padStart(6, "0")}`}</strong></span>
                <span>Fecha: <strong>{new Date(currentSale.sale_date || currentSale.created_at || (currentSale as any).sold_at || Date.now()).toLocaleDateString("es-BO")}</strong></span>
              </div>

              <div className="flex justify-between">
                <span>Cliente: <strong>{clientName}</strong></span>
                <span>NIT/CI: <strong>{nitCi}</strong></span>
              </div>

              <div className="border-t pt-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground font-semibold">
                      <th className="py-1">Cant</th>
                      <th className="py-1">Medicamento / Detalle</th>
                      <th className="py-1 text-right">P. Unit</th>
                      <th className="py-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-muted-foreground">
                          No hay items detallados en este registro.
                        </td>
                      </tr>
                    ) : (
                      details.map((d: any, idx: number) => {
                        const medName = d.medicament?.name || d.medicamento?.nombre || d.name || `Medicamento #${d.medicament_id || idx + 1}`;
                        const medConc = d.medicament?.concentration || d.medicamento?.concentracion || "";
                        const qty = d.quantity || d.cantidad || 1;
                        const unitPrice = d.unit_price || d.precio_unitario || 0;
                        const subtotal = d.subtotal || (qty * unitPrice);

                        return (
                          <tr key={d.id || idx} className="border-b border-border/40">
                            <td className="py-1.5 font-mono text-center">{qty}</td>
                            <td className="py-1.5 pr-2">
                              <span className="font-medium">{medName}</span>
                              {medConc ? <span className="text-[11px] text-muted-foreground block">{medConc}</span> : null}
                            </td>
                            <td className="py-1.5 text-right font-mono text-[11px]">{formatCurrency(Number(unitPrice))}</td>
                            <td className="py-1.5 text-right font-mono font-semibold">{formatCurrency(Number(subtotal))}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-sm border-t">
                <span>Total Cancelado</span>
                <span className="font-mono text-base text-primary">{formatCurrency(Number(currentSale.total))}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" className="w-full gap-1.5" onClick={handlePrint} disabled={loading || !currentSale}>
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
