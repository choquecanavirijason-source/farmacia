"use client";

import { useMemo, useState } from "react";
import { Ban, Eye, MoreHorizontal, Receipt, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TablePagination } from "@/components/layout/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
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
  const [search, setSearch] = useState("");
  const [facturaTarget, setFacturaTarget] = useState<Venta | null>(null);
  const [anularTarget, setAnularTarget] = useState<Venta | null>(null);

  const clienteById = useMemo(() => new Map(clientes.map((c) => [c.id_cliente, c.nombre])), [clientes]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const ordenadas = [...ventas].sort((a, b) => b.id_venta - a.id_venta);
    if (!query) return ordenadas;
    return ordenadas.filter((v) => clienteById.get(v.id_cliente)?.toLowerCase().includes(query));
  }, [ventas, search, clienteById]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente…"
          className="pl-8"
          aria-label="Buscar ventas"
        />
      </div>

      {ventas.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Receipt className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Todavía no hay ventas registradas</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <SearchX className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Sin resultados</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Forma de pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems?.map((v) => (
                <TableRow key={v.id_venta}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatFecha(v.fecha)}</TableCell>
                  <TableCell className="max-w-40 truncate font-medium">
                    {clienteById.get(v.id_cliente) ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{v.forma_pago}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium">{formatCurrency(v.total)}</TableCell>
                  <TableCell>
                    <Badge variant={v.estado === "activa" ? "success" : "secondary"}>
                      {v.estado === "activa" ? "Activa" : "Anulada"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para la venta #${v.id_venta}`} />}
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setFacturaTarget(v)}>
                          <Eye className="size-4" aria-hidden />
                          Ver factura
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
