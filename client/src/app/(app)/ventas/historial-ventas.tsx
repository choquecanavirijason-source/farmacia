"use client";

import { useMemo, useState } from "react";
import { Ban, Eye, MoreHorizontal, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import type { Cliente, Medicamento, Venta } from "@/lib/types";
import { FacturaSheet } from "@/app/(app)/ventas/factura-sheet";
import { AnularVentaDialog } from "@/app/(app)/ventas/anular-venta-dialog";

interface HistorialVentasProps {
  ventas: Venta[];
  clientes: Cliente[];
  medicamentos: Medicamento[];
  onVentaAnulada: (venta: Venta) => void;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

export function HistorialVentas({ ventas, clientes, medicamentos, onVentaAnulada }: HistorialVentasProps) {
  const [facturaTarget, setFacturaTarget] = useState<Venta | null>(null);
  const [anularTarget, setAnularTarget] = useState<Venta | null>(null);

  const clienteById = useMemo(() => new Map(clientes.map((c) => [c.id_cliente, c.nombre])), [clientes]);

  const ordenadas = useMemo(() => [...ventas].sort((a, b) => b.id_venta - a.id_venta), [ventas]);

  const columns: DataTableColumn<Venta>[] = [
    {
      key: "fecha",
      header: "Fecha",
      accessor: (v) => v.fecha,
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, v) => formatFecha(v.fecha),
    },
    {
      key: "cliente",
      header: "Cliente",
      accessor: (v) => clienteById.get(v.id_cliente) ?? null,
      className: "max-w-40 truncate font-medium",
    },
    {
      key: "forma_pago",
      header: "Forma de pago",
      accessor: (v) => v.forma_pago,
      className: "whitespace-nowrap text-muted-foreground",
    },
    {
      key: "total",
      header: "Total",
      accessor: (v) => v.total,
      className: "whitespace-nowrap text-right font-medium",
      render: (_, v) => formatCurrency(v.total),
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (v) => v.estado,
      render: (_, v) => (
        <Badge variant={v.estado === "activa" ? "success" : "secondary"}>
          {v.estado === "activa" ? "Activa" : "Anulada"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, v) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para la venta #${v.id_venta}`} />}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setFacturaTarget(v)}>
              <Eye className="size-4" aria-hidden />
              Ver / reimprimir factura
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={v.estado !== "activa"}
              onSelect={() => setAnularTarget(v)}
            >
              <Ban className="size-4" aria-hidden />
              Anular
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {ventas.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Receipt className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Todavía no hay ventas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={ordenadas}
          columns={columns}
          searchPlaceholder="Buscar por cliente…"
          emptyMessage="No se encontraron ventas."
        />
      )}

      <FacturaSheet
        venta={facturaTarget}
        medicamentos={medicamentos}
        onOpenChange={(open) => !open && setFacturaTarget(null)}
      />

      <AnularVentaDialog
        venta={anularTarget}
        medicamentos={medicamentos}
        onOpenChange={(open) => !open && setAnularTarget(null)}
        onAnulada={onVentaAnulada}
      />
    </div>
  );
}
