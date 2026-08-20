"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchKardexByLote } from "@/lib/api/lotes";
import type { KardexMovimiento, Lote } from "@/lib/types";

interface KardexSheetProps {
  lote: Lote | null;
  onOpenChange: (open: boolean) => void;
}

const TIPO_META: Record<KardexMovimiento["tipo"], { label: string; icon: typeof ArrowUpCircle; className: string }> = {
  entrada: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  salida: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

function KardexBody({ lote }: { lote: Lote }) {
  const [movimientos, setMovimientos] = useState<KardexMovimiento[] | null>(null);

  useEffect(() => {
    fetchKardexByLote(lote.id_lote).then(setMovimientos);
  }, [lote.id_lote]);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
      {movimientos === null ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
      ) : movimientos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin movimientos registrados.</p>
      ) : (
        movimientos.map((mov) => {
          const meta = TIPO_META[mov.tipo];
          const Icon = meta.icon;
          return (
            <div
              key={mov.id_movimiento}
              className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${meta.className}`} aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${meta.className}`}>
                    {mov.cantidad > 0 ? "+" : ""}
                    {mov.cantidad}
                  </span>
                </div>
                <p className="wrap-break-word text-xs text-muted-foreground">{mov.motivo}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{formatFecha(mov.fecha)}</span>
                  <span>Saldo: {mov.saldo}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export function KardexSheet({ lote, onOpenChange }: KardexSheetProps) {
  return (
    <Sheet open={Boolean(lote)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Kardex del lote</SheetTitle>
          <SheetDescription className="wrap-break-word">
            {lote ? (
              <>
                Lote <strong>{lote.numero_lote}</strong> — trazabilidad de entradas, salidas y ajustes.
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>
        {lote ? <KardexBody key={lote.id_lote} lote={lote} /> : null}
      </SheetContent>
    </Sheet>
  );
}
