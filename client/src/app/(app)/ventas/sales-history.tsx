"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchSales } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/format";
import type { ISale } from "@/lib/types/sale";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { VoidSaleDialog } from "./void-sale-dialog";
import { InvoiceSheet } from "./invoice-sheet";

export function SalesHistory() {
  const { can } = useAuth();
  const [sales, setSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidTarget, setVoidTarget] = useState<ISale | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<ISale | null>(null);

  function loadSales() {
    setLoading(true);
    fetchSales()
      .then((res) => {
        setSales(res.data);
      })
      .catch(() => {
        toast.error("Error al cargar el historial de ventas.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSales();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sales.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg">
          No hay ventas registradas.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b bg-muted/50 font-medium">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono">#{sale.id}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(sale.sale_date || sale.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="p-3 font-medium">
                    {sale.client ? `${sale.client.firstname} ${sale.client.lastname}` : "Cliente General"}
                  </td>
                  <td className="p-3 font-semibold font-mono">
                    {formatCurrency(Number(sale.total))}
                  </td>
                  <td className="p-3">
                    <Badge variant={sale.status === "active" || sale.status === "activa" ? "success" : "destructive"}>
                      {sale.status === "active" || sale.status === "activa" ? "Completada" : "Anulada"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setInvoiceTarget(sale)}
                        title="Ver comprobante"
                      >
                        <FileText className="size-4" />
                      </Button>
                      {can(PERMISSIONS.VOID_SALES) && (sale.status === "active" || sale.status === "activa") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setVoidTarget(sale)}
                          title="Anular venta"
                        >
                          <Ban className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VoidSaleDialog
        open={Boolean(voidTarget)}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        sale={voidTarget}
        onVoided={loadSales}
      />

      <InvoiceSheet
        open={Boolean(invoiceTarget)}
        onOpenChange={(open) => !open && setInvoiceTarget(null)}
        sale={invoiceTarget}
      />
    </div>
  );
}

// Alias de compatibilidad
export const HistorialVentas = SalesHistory;
