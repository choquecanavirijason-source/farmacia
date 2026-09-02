"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import type { Lote, Medicamento } from "@/lib/types";

interface MedicamentBatchesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicamento: Medicamento | any | null;
  lotes?: Lote[];
}

export function MedicamentBatchesSheet({
  open,
  onOpenChange,
  medicamento,
  lotes = [],
}: MedicamentBatchesSheetProps) {
  if (!open || !medicamento) return null;

  const lotesDelMedicamento: any[] = (medicamento.batches && medicamento.batches.length > 0)
    ? medicamento.batches
    : lotes.filter(
        (l) =>
          (l.id_medicamento || (l as any).medicament_id) ===
          (medicamento.id_medicamento || medicamento.id)
      );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{medicamento.nombre || medicamento.name}</SheetTitle>
          <SheetDescription>
            Código: <span className="font-mono">{medicamento.codigo || medicamento.code}</span> —{" "}
            {medicamento.concentracion || medicamento.concentration}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Lotes Registrados ({lotesDelMedicamento.length})
          </p>

          {lotesDelMedicamento.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-xs text-muted-foreground">
              No hay lotes con stock para este medicamento.
            </div>
          ) : (
            <div className="divide-y rounded-lg border text-xs">
              {lotesDelMedicamento.map((l) => {
                const currentQty = Number(l.cantidad_actual ?? l.current_quantity ?? 0);
                const expDate = l.fecha_vencimiento || l.expiration_date;
                const buyPrice = Number(l.precio_compra ?? l.purchase_price ?? 0);

                return (
                  <div key={l.id_lote || l.id} className="flex items-center justify-between p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-medium">{l.numero_lote || l.batch_number}</span>
                      <span className="text-muted-foreground">
                        Vence: {expDate ? new Date(expDate).toLocaleDateString("es-BO") : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-semibold">{currentQty} uds</span>
                        <p className="text-[10px] text-muted-foreground">
                          Compra: {formatCurrency(buyPrice)}
                        </p>
                      </div>
                      {currentQty <= 0 ? (
                        <Badge variant="destructive">Agotado</Badge>
                      ) : (
                        <Badge variant="success">En stock</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const LotesMedicamentoSheet = MedicamentBatchesSheet;
