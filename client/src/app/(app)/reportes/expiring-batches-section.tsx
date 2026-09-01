"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { diasHasta } from "@/lib/api/batches";
import { formatDate } from "@/lib/format";

interface ExpiringBatchesSectionProps {
  lotes: any[] | null;
  loadingCatalogs: boolean;
  medicamentoById: Map<number, any>;
}

export function ExpiringBatchesSection({
  lotes,
  loadingCatalogs,
  medicamentoById,
}: ExpiringBatchesSectionProps) {
  const [ventanaDias, setVentanaDias] = useState("90");
  const [printOpen, setPrintOpen] = useState(false);

  const lotesAnalisis = useMemo(() => {
    if (!lotes) return null;
    const diasLimite = ventanaDias === "all" ? 99999 : Number(ventanaDias);

    return lotes
      .filter((l: any) => {
        const dias = diasHasta(l.expiration_date || l.fecha_vencimiento);
        if (ventanaDias === "all") return true;
        return dias <= diasLimite;
      })
      .sort((a: any, b: any) => {
        const dA = diasHasta(a.expiration_date || a.fecha_vencimiento);
        const dB = diasHasta(b.expiration_date || b.fecha_vencimiento);
        return dA - dB;
      });
  }, [lotes, ventanaDias]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-xs text-muted-foreground font-medium">Ventana de vencimiento:</span>
          <Select value={ventanaDias} onValueChange={(v) => setVentanaDias(v ?? "90")}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Próximos 15 días</SelectItem>
              <SelectItem value="30">Próximos 30 días</SelectItem>
              <SelectItem value="60">Próximos 60 días</SelectItem>
              <SelectItem value="90">Próximos 90 días (3 meses)</SelectItem>
              <SelectItem value="180">Próximos 180 días (6 meses)</SelectItem>
              <SelectItem value="365">Próximo 1 año</SelectItem>
              <SelectItem value="all">Todos los lotes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {lotesAnalisis && lotesAnalisis.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setPrintOpen(true)}
          >
            <Printer className="size-4" aria-hidden />
            Imprimir Reporte
          </Button>
        )}
      </div>

      {loadingCatalogs || lotesAnalisis === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : lotesAnalisis.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle2 className="size-6 text-success" aria-hidden />
            <p className="text-sm font-medium">
              Ningún lote vence dentro de esta ventana de tiempo ({ventanaDias === "all" ? "Todos" : `${ventanaDias} días`})
            </p>
          </CardContent>
        </Card>
      ) : (
        <ExpiringBatchesTable items={lotesAnalisis} medicamentoById={medicamentoById} />
      )}

      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        title={`Reporte: Lotes Próximos a Vencer (${ventanaDias === "all" ? "Todos" : ventanaDias + " días"})`}
      >
        {lotesAnalisis ? (
          <ExpiringBatchesTable items={lotesAnalisis} medicamentoById={medicamentoById} />
        ) : null}
      </PrintDialog>
    </div>
  );
}

function ExpiringBatchesTable({
  items,
  medicamentoById,
}: {
  items: any[];
  medicamentoById: Map<number, any>;
}) {
  const columns: DataTableColumn<any>[] = [
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (l) => {
        const m = medicamentoById.get(l.medicament_id || l.id_medicamento);
        return m?.name || m?.nombre || `Medicamento #${l.medicament_id || l.id_medicamento}`;
      },
      className: "font-medium text-xs",
    },
    {
      key: "batch_number",
      header: "N° Lote",
      accessor: (l) => l.batch_number || l.numero_lote,
      className: "w-32 font-mono text-xs",
    },
    {
      key: "expiration_date",
      header: "Vencimiento",
      accessor: (l) => l.expiration_date || l.fecha_vencimiento,
      className: "w-32 text-xs font-mono",
      render: (_, l) => formatDate(l.expiration_date || l.fecha_vencimiento),
    },
    {
      key: "dias",
      header: "Tiempo Restante",
      accessor: (l) => diasHasta(l.expiration_date || l.fecha_vencimiento),
      className: "w-36 text-center",
      render: (_, l) => {
        const dias = diasHasta(l.expiration_date || l.fecha_vencimiento);
        return (
          <Badge variant={dias <= 0 ? "destructive" : dias <= 30 ? "warning" : "secondary"}>
            {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : dias === 0 ? "Vence hoy" : `${dias} días`}
          </Badge>
        );
      },
    },
    {
      key: "current_quantity",
      header: "Stock Lote",
      accessor: (l) => Number(l.current_quantity ?? l.cantidad_actual ?? 0),
      className: "w-28 text-right font-mono text-xs font-semibold",
      render: (_, l) => `${l.current_quantity ?? l.cantidad_actual ?? 0} uds`,
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar por medicamento o N° de lote…"
      emptyMessage="No se encontraron lotes."
    />
  );
}
