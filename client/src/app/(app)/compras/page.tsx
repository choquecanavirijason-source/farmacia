"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  DollarSign,
  Eye,
  Filter,
  Plus,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/combobox";
import { fetchCompras } from "@/lib/api/purchases";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { fetchProveedores } from "@/lib/api/suppliers";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { Compra, Medicamento, Proveedor } from "@/lib/types";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { PurchaseDetailSheet } from "./purchase-detail-sheet";

function formatDateSafe(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

interface EnrichedPurchase extends Compra {
  proveedor_nombre: string;
  proveedor_nit?: string;
  fecha_formateada: string;
}

export default function ComprasPage() {
  const { can } = useAuth();
  const [compras, setCompras] = useState<Compra[] | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  // Filtros
  const [proveedorFilter, setProveedorFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
    () => new Map(proveedores.map((p) => [p.id_proveedor || p.id, p])),
    [proveedores]
  );

  const enrichedPurchases: EnrichedPurchase[] = useMemo(() => {
    if (!compras) return [];

    return compras.map((c) => {
      const prov = proveedorById.get(c.id_proveedor || (c as any).supplier_id);
      const rawDate = c.fecha_compra || (c as any).purchase_date || c.created_at;

      return {
        ...c,
        proveedor_nombre: prov?.nombre || prov?.name || "Proveedor no asignado",
        proveedor_nit: prov?.nit || "",
        fecha_formateada: formatDateSafe(rawDate),
      };
    }).sort((a, b) => (b.id_compra || b.id || 0) - (a.id_compra || a.id || 0));
  }, [compras, proveedorById]);

  // Filtros aplicados
  const filteredPurchases = useMemo(() => {
    return enrichedPurchases.filter((c) => {
      if (proveedorFilter && String(c.id_proveedor || (c as any).supplier_id) !== proveedorFilter) {
        return false;
      }
      const rawDate = c.fecha_compra || (c as any).purchase_date || c.created_at;
      if (startDate && rawDate && rawDate < startDate) {
        return false;
      }
      if (endDate && rawDate && rawDate > endDate) {
        return false;
      }
      return true;
    });
  }, [enrichedPurchases, proveedorFilter, startDate, endDate]);

  // Métricas KPI
  const stats = useMemo(() => {
    const totalCount = enrichedPurchases.length;
    const totalInvested = enrichedPurchases.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const activeSuppliers = proveedores.length;

    return {
      totalCount,
      totalInvested,
      activeSuppliers,
    };
  }, [enrichedPurchases, proveedores]);

  function handleSaved(saved: Compra) {
    setCompras((prev) => (prev ? [saved, ...prev] : [saved]));
    toast.success(`Compra registrada — factura ${saved.numero_factura}.`);
  }

  const isLoading = compras === null;
  const hasAny = (compras?.length ?? 0) > 0;
  const puedeRegistrar = proveedores.length > 0 && medicamentos.length > 0;

  const columns: DataTableColumn<EnrichedPurchase>[] = [
    {
      key: "numero_factura",
      header: "N° Factura",
      accessor: (c) => c.numero_factura || (c as any).invoice_number,
      className: "w-36 font-mono text-xs",
      render: (_, c) => (
        <span className="font-mono text-xs font-semibold">
          {c.numero_factura || (c as any).invoice_number || `#${c.id_compra || c.id}`}
        </span>
      ),
    },
    {
      key: "proveedor",
      header: "Proveedor",
      accessor: (c) => c.proveedor_nombre,
      className: "min-w-48 max-w-72",
      render: (_, c) => (
        <div className="flex flex-col">
          <span className="font-medium text-xs text-foreground">
            {c.proveedor_nombre}
          </span>
          {c.proveedor_nit ? (
            <span className="text-[11px] font-mono text-muted-foreground">
              NIT: {c.proveedor_nit}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "fecha",
      header: "Fecha de Compra",
      accessor: (c) => c.fecha_formateada,
      className: "w-36 text-xs text-muted-foreground",
    },
    {
      key: "total",
      header: "Total Invertido",
      accessor: (c) => Number(c.total || 0),
      className: "w-36 text-right font-mono text-xs",
      render: (_, c) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {formatCurrency(Number(c.total || 0))}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Detalle",
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-20 text-center",
      render: (_, c) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ver detalle de la factura ${c.numero_factura}`}
          title="Ver detalle y productos de la compra"
          onClick={() => setDetalleTarget(c)}
        >
          <Eye className="size-4" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Registro de Compras
          </h1>
          <p className="text-sm text-muted-foreground">
            Adquisición de mercadería, ingreso de lotes y actualización automática de stock.
          </p>
        </div>
        {can(PERMISSIONS.CREATE_PURCHASES) && (
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
        )}
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Compras</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{stats.totalCount}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Proveedores Registrados</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{stats.activeSuppliers}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inversión Total en Compras</p>
              <p className="text-lg font-bold font-mono tracking-tight text-primary truncate">
                {formatCurrency(stats.totalInvested)}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <DollarSign className="size-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros con Select2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span className="font-medium">Filtrar por:</span>
          </div>

          <div className="w-56">
            <SearchableSelect
              options={proveedores.map((p) => ({
                value: String(p.id_proveedor || p.id),
                label: p.nombre || p.name,
                sublabel: p.nit ? `NIT: ${p.nit}` : undefined,
              }))}
              value={proveedorFilter}
              onValueChange={(val) => setProveedorFilter(val)}
              placeholder="Todos los proveedores…"
              searchPlaceholder="Buscar proveedor…"
              clearable
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs w-36"
              placeholder="Desde"
              aria-label="Fecha inicio"
            />
            <span className="text-xs text-muted-foreground">a</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs w-36"
              placeholder="Hasta"
              aria-label="Fecha fin"
            />
          </div>

          {(proveedorFilter || startDate || endDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setProveedorFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
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
            {can(PERMISSIONS.CREATE_PURCHASES) && puedeRegistrar ? (
              <Button type="button" onClick={() => setFormOpen(true)} className="mt-2 gap-1.5">
                <Plus className="size-4" aria-hidden />
                Nueva Compra
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={filteredPurchases}
          columns={columns}
          searchPlaceholder="Buscar por N° de factura, proveedor o fecha…"
          emptyMessage="No se encontraron compras con los criterios seleccionados."
          pageSizeOptions={[10, 20, 50, 100]}
          exportFilename="registro_compras.csv"
          storageKey="registro-compras-table"
          getRowId={(c) => c.id_compra || c.id}
        />
      )}

      <PurchaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proveedores={proveedores}
        medicamentos={medicamentos}
        onCompraRegistrada={handleSaved}
      />

      <PurchaseDetailSheet
        compra={detalleTarget}
        proveedores={proveedores}
        medicamentos={medicamentos}
        open={Boolean(detalleTarget)}
        onOpenChange={(open) => !open && setDetalleTarget(null)}
      />
    </div>
  );
}
