"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDetallesByCompra } from "@/lib/api/compras";
import { formatCurrency } from "@/lib/format";
import type { Compra, DetalleCompra, Medicamento, Proveedor } from "@/lib/types";

interface DetalleCompraSheetProps {
  compra: Compra | null;
  proveedores: Proveedor[];
  medicamentos: Medicamento[];
  onOpenChange: (open: boolean) => void;
}

function DetalleBody({
  compra,
  medicamentos,
}: {
  compra: Compra;
  medicamentos: Medicamento[];
}) {
  const [detalles, setDetalles] = useState<DetalleCompra[] | null>(null);

  useEffect(() => {
    fetchDetallesByCompra(compra.id_compra).then(setDetalles);
  }, [compra.id_compra]);

  const medicamentoById = new Map(medicamentos.map((m) => [m.id_medicamento, m]));

  return (
    <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
      {detalles === null ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
      ) : detalles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin líneas registradas.</p>
      ) : (
        detalles.map((d) => {
          const medicamento = medicamentoById.get(d.id_medicamento);
          return (
            <div key={d.id_detalle_compra} className="flex flex-col gap-1 rounded-lg border border-border/60 p-3">
              <p className="wrap-break-word text-sm font-medium">{medicamento?.nombre ?? "—"}</p>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  {d.cantidad} × {formatCurrency(d.precio_unitario)}
                </span>
                <span className="font-medium text-foreground">{formatCurrency(d.subtotal)}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export function DetalleCompraSheet({
  compra,
  proveedores,
  medicamentos,
  onOpenChange,
}: DetalleCompraSheetProps) {
  const proveedor = compra ? proveedores.find((p) => p.id_proveedor === compra.id_proveedor) : null;

  return (
    <Sheet open={Boolean(compra)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalle de compra</SheetTitle>
          <SheetDescription className="wrap-break-word">
            {compra ? (
              <>
                Factura <strong>{compra.numero_factura}</strong> — {proveedor?.nombre ?? "—"} ({compra.fecha})
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>
        {compra ? <DetalleBody key={compra.id_compra} compra={compra} medicamentos={medicamentos} /> : null}
      </SheetContent>
    </Sheet>
  );
}
