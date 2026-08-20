"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLotes, diasHasta, DIAS_ALERTA_VENCIMIENTO } from "@/lib/api/lotes";
import type { Lote, Medicamento } from "@/lib/types";

interface LotesMedicamentoSheetProps {
  medicamento: Medicamento | null;
  onOpenChange: (open: boolean) => void;
}

function LotesBody({ medicamento }: { medicamento: Medicamento }) {
  const [lotes, setLotes] = useState<Lote[] | null>(null);

  useEffect(() => {
    fetchLotes().then((todos) =>
      setLotes(
        todos
          .filter((l) => l.id_medicamento === medicamento.id_medicamento)
          .sort((a, b) => diasHasta(a.fecha_vencimiento) - diasHasta(b.fecha_vencimiento))
      )
    );
  }, [medicamento.id_medicamento]);

  if (lotes === null) {
    return (
      <div className="flex flex-col gap-2 px-4 pb-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (lotes.length === 0) {
    return <p className="px-4 pb-4 text-sm text-muted-foreground">Este medicamento no tiene lotes registrados.</p>;
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-4">
      {lotes.map((l) => {
        const dias = diasHasta(l.fecha_vencimiento);
        const vencido = dias < 0;
        const porVencer = !vencido && dias <= DIAS_ALERTA_VENCIMIENTO;
        return (
          <div key={l.id_lote} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-medium">{l.numero_lote}</p>
              <p className="text-xs text-muted-foreground">Vence: {l.fecha_vencimiento}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {vencido ? (
                <Badge variant="destructive">Vencido</Badge>
              ) : porVencer ? (
                <Badge variant="warning">Por vencer</Badge>
              ) : null}
              <span className="text-sm font-semibold tabular-nums">{l.cantidad_actual}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LotesMedicamentoSheet({ medicamento, onOpenChange }: LotesMedicamentoSheetProps) {
  return (
    <Sheet open={Boolean(medicamento)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Lotes del medicamento</SheetTitle>
          <SheetDescription className="wrap-break-word">{medicamento?.nombre}</SheetDescription>
        </SheetHeader>
        {medicamento ? <LotesBody key={medicamento.id_medicamento} medicamento={medicamento} /> : null}
      </SheetContent>
    </Sheet>
  );
}
