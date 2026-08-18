"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDetallesByVenta, fetchFacturaByVenta } from "@/lib/api/ventas";
import { fetchEmpresa } from "@/lib/api/empresa";
import { formatCurrency } from "@/lib/format";
import type { DetalleVenta, Empresa, Factura, Medicamento, Venta } from "@/lib/types";

interface FacturaSheetProps {
  venta: Venta | null;
  medicamentos: Medicamento[];
  onOpenChange: (open: boolean) => void;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

function FacturaBody({ venta, medicamentos }: { venta: Venta; medicamentos: Medicamento[] }) {
  const [factura, setFactura] = useState<Factura | null>(null);
  const [detalles, setDetalles] = useState<DetalleVenta[] | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    Promise.all([fetchFacturaByVenta(venta.id_venta), fetchDetallesByVenta(venta.id_venta), fetchEmpresa()]).then(
      ([f, d, e]) => {
        setFactura(f);
        setDetalles(d);
        setEmpresa(e);
      }
    );
  }, [venta.id_venta]);

  const medicamentoById = new Map(medicamentos.map((m) => [m.id_medicamento, m]));

  if (!factura || !detalles || !empresa) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="no-print w-fit gap-1.5 self-end"
        onClick={() => window.print()}
      >
        <Printer className="size-4" aria-hidden />
        Imprimir recibo
      </Button>

      {/* Recibo — estilo comprobante, es lo único visible al imprimir (ver #factura-print en globals.css). */}
      <div
        id="factura-print"
        className="mx-auto flex w-full max-w-xs flex-col gap-3 rounded-lg border border-dashed border-border/60 bg-background p-4 font-mono text-xs"
      >
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold">{empresa.nombre}</p>
          {empresa.nit ? <p>NIT: {empresa.nit}</p> : null}
          {empresa.direccion ? <p className="wrap-break-word">{empresa.direccion}</p> : null}
          {empresa.telefono ? <p>Tel: {empresa.telefono}</p> : null}
        </div>

        <div className="border-t border-dashed border-border/60" />

        <div className="flex flex-col gap-0.5">
          <p className="text-center font-semibold">FACTURA N° {factura.numero_factura}</p>
          <p>Fecha: {formatFecha(factura.fecha_emision)}</p>
          <p className="wrap-break-word">Cliente: {factura.razon_social}</p>
          <p>NIT/CI: {factura.nit_cliente}</p>
          <p>Forma de pago: {venta.forma_pago}</p>
        </div>

        <div className="border-t border-dashed border-border/60" />

        <div className="flex flex-col gap-1">
          {detalles.map((d) => (
            <div key={d.id_detalle_venta} className="flex flex-col">
              <span className="wrap-break-word">{medicamentoById.get(d.id_medicamento)?.nombre ?? "—"}</span>
              <div className="flex items-center justify-between">
                <span>
                  {d.cantidad} × {formatCurrency(d.precio_unitario)}
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(d.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-border/60" />

        <div className="flex items-center justify-between text-sm font-semibold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatCurrency(factura.total)}</span>
        </div>

        <div className="border-t border-dashed border-border/60" />

        <p className="text-center">¡Gracias por su compra!</p>
      </div>
    </div>
  );
}

export function FacturaSheet({ venta, medicamentos, onOpenChange }: FacturaSheetProps) {
  return (
    <Dialog open={Boolean(venta)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="no-print">
          <DialogTitle>Factura</DialogTitle>
          <DialogDescription>Comprobante de la venta.</DialogDescription>
        </DialogHeader>
        {venta ? <FacturaBody key={venta.id_venta} venta={venta} medicamentos={medicamentos} /> : null}
      </DialogContent>
    </Dialog>
  );
}
