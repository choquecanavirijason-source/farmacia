"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { anularVenta, fetchDetallesByVenta } from "@/lib/api/ventas";
import { ApiError } from "@/lib/api/client";
import type { DetalleVenta, Medicamento, Venta } from "@/lib/types";

interface AnularVentaDialogProps {
  venta: Venta | null;
  medicamentos: Medicamento[];
  onOpenChange: (open: boolean) => void;
  onAnulada: (venta: Venta) => void;
}

function AnularVentaBody({
  venta,
  medicamentos,
  onOpenChange,
  onAnulada,
}: {
  venta: Venta;
  medicamentos: Medicamento[];
  onOpenChange: (open: boolean) => void;
  onAnulada: (venta: Venta) => void;
}) {
  const [detalles, setDetalles] = useState<DetalleVenta[] | null>(null);
  const [anulando, setAnulando] = useState(false);

  useEffect(() => {
    fetchDetallesByVenta(venta.id_venta).then(setDetalles);
  }, [venta.id_venta]);

  const medicamentoById = new Map(medicamentos.map((m) => [m.id_medicamento, m]));

  async function handleConfirm() {
    setAnulando(true);
    try {
      const actualizada = await anularVenta(venta.id_venta);
      onAnulada(actualizada);
      onOpenChange(false);
      toast.success("Venta anulada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo anular la venta.");
    } finally {
      setAnulando(false);
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Anular esta venta?</AlertDialogTitle>
        <AlertDialogDescription>
          Se devolverá el siguiente stock a su lote de origen y se registrará en el kardex. Esta acción
          no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex flex-col gap-1.5">
        {detalles === null ? (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        ) : (
          detalles.map((d) => (
            <div key={d.id_detalle_venta} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {medicamentoById.get(d.id_medicamento)?.nombre ?? "—"}
              </span>
              <span className="shrink-0 font-medium tabular-nums">+{d.cantidad} unid.</span>
            </div>
          ))
        )}
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={anulando}>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={anulando || detalles === null}
          onClick={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          {anulando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Anulando…
            </>
          ) : (
            "Anular venta"
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

export function AnularVentaDialog({ venta, medicamentos, onOpenChange, onAnulada }: AnularVentaDialogProps) {
  return (
    <AlertDialog open={Boolean(venta)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {venta ? (
          <AnularVentaBody
            key={venta.id_venta}
            venta={venta}
            medicamentos={medicamentos}
            onOpenChange={onOpenChange}
            onAnulada={onAnulada}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
