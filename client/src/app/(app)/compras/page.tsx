"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { fetchCompras } from "@/lib/api/compras";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import { fetchProveedores } from "@/lib/api/proveedores";
import { formatCurrency } from "@/lib/format";
import type { Compra, Medicamento, Proveedor } from "@/lib/types";
import { CompraFormDialog } from "@/app/(app)/compras/compra-form-dialog";
import { DetalleCompraSheet } from "@/app/(app)/compras/detalle-compra-sheet";

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[] | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [detalleTarget, setDetalleTarget] = useState<Compra | null>(null);

  useEffect(() => {
    Promise.all([fetchCompras(), fetchProveedores(), fetchMedicamentos()]).then(
      ([comprasData, proveedoresData, medicamentosData]) => {
        setCompras(comprasData);
        setProveedores(proveedoresData);
        setMedicamentos(medicamentosData);
      }
    );
  }, []);

  const proveedorById = useMemo(
    () => new Map(proveedores.map((p) => [p.id_proveedor, p.nombre])),
    [proveedores]
  );

  const ordenadas = useMemo(
    () => (compras ? [...compras].sort((a, b) => b.id_compra - a.id_compra) : null),
    [compras]
  );

  function handleSaved(saved: Compra) {
    setCompras((prev) => (prev ? [...prev, saved] : [saved]));
    toast.success(`Compra registrada — factura ${saved.numero_factura}.`);
  }

  const isLoading = compras === null;
  const hasAny = (compras?.length ?? 0) > 0;
  const puedeRegistrar = proveedores.length > 0 && medicamentos.length > 0;

  const columns: DataTableColumn<Compra>[] = [
    {
      key: "numero_factura",
      header: "N° Factura",
      accessor: (c) => c.numero_factura,
      className: "max-w-32 truncate font-mono text-xs",
    },
    {
      key: "proveedor",
      header: "Proveedor",
      accessor: (c) => proveedorById.get(c.id_proveedor) ?? null,
      className: "max-w-56 truncate font-medium",
    },
    {
      key: "fecha",
      header: "Fecha",
      accessor: (c) => c.fecha,
      className: "whitespace-nowrap text-muted-foreground",
    },
    {
      key: "total",
      header: "Total",
      accessor: (c) => c.total,
      className: "whitespace-nowrap text-right font-medium",
      render: (_, c) => formatCurrency(c.total),
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, c) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ver detalle de la factura ${c.numero_factura}`}
          onClick={() => setDetalleTarget(c)}
        >
          <Eye className="size-4" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Registro de Compras</h1>
          <p className="text-sm text-muted-foreground">
            Cada compra ingresa medicamentos a un lote nuevo y aumenta el stock.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={!puedeRegistrar}
          className="shrink-0 gap-1.5"
          title={puedeRegistrar ? undefined : "Registra al menos un proveedor y un medicamento primero"}
        >
          <Plus className="size-4" aria-hidden />
          Nueva Compra
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !hasAny ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Aún no hay compras registradas</p>
              <p className="max-w-sm text-xs text-balance text-muted-foreground">
                {puedeRegistrar
                  ? "Registra tu primera compra para ingresar stock al inventario."
                  : "Registra primero al menos un proveedor y un medicamento."}
              </p>
            </div>
            {puedeRegistrar ? (
              <Button type="button" onClick={() => setFormOpen(true)} className="mt-2 gap-1.5">
                <Plus className="size-4" aria-hidden />
                Nueva Compra
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={ordenadas ?? []}
          columns={columns}
          searchPlaceholder="Buscar por N° de factura o proveedor…"
          emptyMessage="No se encontraron compras."
        />
      )}

      <CompraFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proveedores={proveedores}
        medicamentos={medicamentos}
        onSaved={handleSaved}
      />

      <DetalleCompraSheet
        compra={detalleTarget}
        proveedores={proveedores}
        medicamentos={medicamentos}
        onOpenChange={(open) => !open && setDetalleTarget(null)}
      />
    </div>
  );
}
