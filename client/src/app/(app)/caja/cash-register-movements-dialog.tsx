"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { fetchMovimientosByCaja } from "@/lib/api/cash-registers";
import { formatCurrency } from "@/lib/format";
import type { MovimientoCaja } from "@/lib/types";
import type { ICashRegister } from "@/lib/types/cash-register";

function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

const columns: DataTableColumn<MovimientoCaja>[] = [
  {
    key: "tipo",
    header: "Tipo",
    accessor: (m) => m.tipo,
    render: (_, m) => (
      <Badge variant={m.tipo === "ingreso" ? "success" : "destructive"}>
        {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
      </Badge>
    ),
  },
  {
    key: "concepto",
    header: "Concepto / Motivo",
    accessor: (m: any) => m.concepto || m.concept,
    render: (_, m: any) => <span className="font-medium text-xs">{m.concepto || m.concept}</span>,
  },
  {
    key: "monto",
    header: "Monto",
    accessor: (m) => m.monto,
    className: "text-right",
    render: (_, m) => (
      <span
        className={`font-semibold font-mono text-xs ${
          m.tipo === "ingreso" ? "text-success" : "text-destructive"
        }`}
      >
        {m.tipo === "ingreso" ? "+" : "-"}
        {formatCurrency(m.monto)}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Hora",
    accessor: (m) => m.created_at,
    render: (_, m) => (
      <span className="text-muted-foreground text-xs">{formatFecha(m.created_at)}</span>
    ),
  },
];

interface CashRegisterMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister: ICashRegister | null;
}

export function CashRegisterMovementsDialog({
  open,
  onOpenChange,
  cashRegister,
}: CashRegisterMovementsDialogProps) {
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !cashRegister) return;
    setLoading(true);
    fetchMovimientosByCaja(cashRegister.id)
      .then(setMovimientos)
      .catch(() => setMovimientos([]))
      .finally(() => setLoading(false));
  }, [open, cashRegister]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Movimientos de la Caja #{cashRegister?.id}</DialogTitle>
          <DialogDescription>
            {cashRegister?.branch?.name ? `${cashRegister.branch.name} — ` : ""}
            Ingresos y egresos registrados durante este turno.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Cargando movimientos…</p>
        ) : movimientos.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center border rounded-lg">
            No hay ingresos ni egresos manuales registrados en este turno.
          </p>
        ) : (
          <DataTable
            data={movimientos}
            columns={columns}
            searchPlaceholder="Buscar movimientos…"
            emptyMessage="No se encontraron movimientos."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
