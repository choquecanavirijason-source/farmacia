"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Pill,
  Printer,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { PrintDialog } from "@/components/layout/print-dialog";
import {
  fetchKardexByMedicamento,
  type KardexMovimientoConLote,
} from "@/lib/api/batches";
import { formatDateTime } from "@/lib/format";

const TIPO_META: Record<string, { label: string; icon: typeof ArrowUpCircle; className: string }> = {
  entrada: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  in: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  salida: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  out: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
  adjustment: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
};

interface KardexSectionProps {
  medicamentos: any[] | null;
  selectedMedicamentId: string;
  onSelectMedicament: (id: string) => void;
}

export function KardexSection({
  medicamentos,
  selectedMedicamentId,
  onSelectMedicament,
}: KardexSectionProps) {
  const [printOpen, setPrintOpen] = useState(false);

  const selectedMedicament = medicamentos?.find(
    (m) => (m.id || m.id_medicamento) === Number(selectedMedicamentId)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 max-w-md flex-1 items-center gap-2">
          <Pill className="size-4 text-primary shrink-0" />
          <Select
            value={selectedMedicamentId}
            onValueChange={(v) => onSelectMedicament(v ?? "")}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Selecciona un medicamento para ver su kardex..." />
            </SelectTrigger>
            <SelectContent>
              {(medicamentos ?? []).map((m: any) => (
                <SelectItem key={m.id || m.id_medicamento} value={String(m.id || m.id_medicamento)}>
                  {m.name || m.nombre} ({m.code || m.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMedicamentId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setPrintOpen(true)}
          >
            <Printer className="size-4" aria-hidden />
            Imprimir Kardex
          </Button>
        ) : null}
      </div>

      {!selectedMedicamentId ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="py-12 text-center text-xs text-muted-foreground">
            Selecciona un medicamento en el menú desplegable superior para consultar su historial de movimientos.
          </CardContent>
        </Card>
      ) : (
        <KardexTabla key={selectedMedicamentId} idMedicamento={Number(selectedMedicamentId)} />
      )}

      {/* Diálogo de Impresión */}
      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        title={`Kardex de Inventario — ${selectedMedicament?.name || selectedMedicament?.nombre || ""}`}
      >
        {selectedMedicamentId ? (
          <KardexTabla idMedicamento={Number(selectedMedicamentId)} />
        ) : null}
      </PrintDialog>
    </div>
  );
}

function KardexTabla({ idMedicamento }: { idMedicamento: number }) {
  const [kardex, setKardex] = useState<KardexMovimientoConLote[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchKardexByMedicamento(idMedicamento)
      .then(setKardex)
      .catch(() => setKardex([]))
      .finally(() => setLoading(false));
  }, [idMedicamento]);

  if (loading || kardex === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (kardex.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-background/60">
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          Sin movimientos registrados para este medicamento.
        </CardContent>
      </Card>
    );
  }

  const columns: DataTableColumn<any>[] = [
    {
      key: "tipo",
      header: "Tipo",
      accessor: (k: any) => TIPO_META[k.tipo || k.type]?.label || k.tipo || k.type,
      className: "w-28",
      render: (_, k: any) => {
        const meta = TIPO_META[k.tipo || k.type] || {
          label: k.tipo || k.type,
          icon: SlidersHorizontal,
          className: "text-muted-foreground",
        };
        const Icon = meta.icon;
        return (
          <span className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${meta.className}`}>
            <Icon className="size-3.5" aria-hidden />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "numero_lote",
      header: "N° Lote",
      accessor: (k: any) => k.numero_lote || k.batch_number || "—",
      className: "w-28 font-mono text-xs",
    },
    {
      key: "cantidad",
      header: "Cantidad",
      accessor: (k: any) => k.cantidad ?? k.quantity,
      className: "w-24 text-right font-mono text-xs",
      render: (_, k: any) => {
        const cant = Number(k.cantidad ?? k.quantity ?? 0);
        const isEntry = k.tipo === "in" || k.tipo === "entrada" || k.type === "in" || k.type === "entrada";
        return (
          <span className={isEntry ? "text-success font-semibold" : "text-destructive font-semibold"}>
            {isEntry ? "+" : "-"}{Math.abs(cant)}
          </span>
        );
      },
    },
    {
      key: "saldo",
      header: "Saldo Resultante",
      accessor: (k: any) => k.saldo ?? k.balance,
      className: "w-28 text-right font-mono text-xs font-bold",
      render: (_, k: any) => `${k.saldo ?? k.balance ?? 0} uds`,
    },
    {
      key: "motivo",
      header: "Motivo / Detalle",
      accessor: (k: any) => k.motivo || k.reason || "—",
      className: "text-xs",
      render: (_, k: any) => (
        <span className="text-muted-foreground">{k.motivo || k.reason || "—"}</span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha y Hora",
      accessor: (k: any) => k.fecha || k.fecha_hora || k.occurred_at || k.created_at || "",
      className: "w-36 text-xs text-muted-foreground font-mono",
      render: (_, k: any) => formatDateTime(k.fecha || k.fecha_hora || k.occurred_at || k.created_at),
    },
  ];

  return (
    <DataTable
      data={kardex}
      columns={columns}
      searchPlaceholder="Buscar por N° de lote o motivo…"
      emptyMessage="No se encontraron movimientos."
    />
  );
}
