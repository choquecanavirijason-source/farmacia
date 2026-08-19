"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, Search, SearchX, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCompras } from "@/lib/api/compras";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import { fetchProveedores } from "@/lib/api/proveedores";
import { formatCurrency } from "@/lib/format";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/layout/table-pagination";
import type { Compra, Medicamento, Proveedor } from "@/lib/types";
import { CompraFormDialog } from "@/app/(app)/compras/compra-form-dialog";
import { DetalleCompraSheet } from "@/app/(app)/compras/detalle-compra-sheet";

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[] | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    if (!compras) return null;
    const query = search.trim().toLowerCase();
    if (!query) return compras;
    return compras.filter(
      (c) =>
        c.numero_factura.toLowerCase().includes(query) ||
        proveedorById.get(c.id_proveedor)?.toLowerCase().includes(query)
    );
  }, [compras, search, proveedorById]);

  const sorted = useMemo(
    () => (filtered ? [...filtered].sort((a, b) => b.id_compra - a.id_compra) : null),
    [filtered]
  );

  function handleSaved(saved: Compra) {
    setCompras((prev) => (prev ? [...prev, saved] : [saved]));
    toast.success(`Compra registrada — factura ${saved.numero_factura}.`);
  }

  const isLoading = compras === null;
  const hasAny = (compras?.length ?? 0) > 0;
  const hasResults = (filtered?.length ?? 0) > 0;
  const puedeRegistrar = proveedores.length > 0 && medicamentos.length > 0;
  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(sorted, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Registro de Compras</h1>
        <p className="text-sm text-muted-foreground">
          Cada compra ingresa medicamentos a un lote nuevo y aumenta el stock.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° de factura o proveedor…"
            className="pl-8"
            aria-label="Buscar compras"
          />
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
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      ) : !hasResults ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="max-w-sm text-xs text-balance text-muted-foreground">
              No encontramos compras para “{search}”.
            </p>
            <Button type="button" variant="outline" onClick={() => setSearch("")} className="mt-2">
              Limpiar búsqueda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems?.map((c) => (
                  <TableRow key={c.id_compra}>
                    <TableCell className="max-w-32 truncate font-mono text-xs" title={c.numero_factura}>
                      {c.numero_factura}
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-medium" title={proveedorById.get(c.id_proveedor)}>
                      {proveedorById.get(c.id_proveedor) ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{c.fecha}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">{formatCurrency(c.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ver detalle de la factura ${c.numero_factura}`}
                        onClick={() => setDetalleTarget(c)}
                      >
                        <Eye className="size-4" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
        />
        </>
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
