"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Eye, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { fetchCategorias } from "@/lib/api/catalogos";
import { fetchLotes } from "@/lib/api/lotes";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/layout/table-pagination";
import type { Categoria, Lote, Medicamento } from "@/lib/types";
import { LotesMedicamentoSheet } from "@/app/(app)/inventario/lotes-medicamento-sheet";

export default function InventarioPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [verLotesDe, setVerLotesDe] = useState<Medicamento | null>(null);

  useEffect(() => {
    Promise.all([fetchMedicamentos(), fetchLotes(), fetchCategorias()]).then(([m, l, c]) => {
      setMedicamentos(m);
      setLotes(l);
      setCategorias(c);
    });
  }, []);

  const categoriaById = useMemo(() => new Map(categorias.map((c) => [c.id_categoria, c.nombre])), [categorias]);

  const stockPorMedicamento = useMemo(() => {
    const map = new Map<number, number>();
    for (const l of lotes) {
      map.set(l.id_medicamento, (map.get(l.id_medicamento) ?? 0) + l.cantidad_actual);
    }
    return map;
  }, [lotes]);

  const filtered = useMemo(() => {
    if (!medicamentos) return null;
    const query = search.trim().toLowerCase();
    if (!query) return medicamentos;
    return medicamentos.filter(
      (m) => m.nombre.toLowerCase().includes(query) || m.codigo.toLowerCase().includes(query)
    );
  }, [medicamentos, search]);

  const isLoading = medicamentos === null;
  const hasResults = (filtered?.length ?? 0) > 0;
  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Consulta de Inventario</h1>
        <p className="text-sm text-muted-foreground">Stock disponible por medicamento, con detalle por lote.</p>
      </div>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="pl-8"
          aria-label="Buscar medicamentos"
        />
      </div>

      {isLoading ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock actual</TableHead>
                <TableHead>Stock mínimo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !hasResults ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="max-w-sm text-xs text-balance text-muted-foreground">
              No encontramos medicamentos para “{search}”.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock actual</TableHead>
                <TableHead>Stock mínimo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems?.map((m) => {
                const stock = stockPorMedicamento.get(m.id_medicamento) ?? 0;
                const bajo = stock < m.stock_minimo;
                return (
                  <TableRow key={m.id_medicamento}>
                    <TableCell className="max-w-56 truncate font-medium" title={m.nombre}>
                      {m.nombre}
                      <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">
                        {m.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-muted-foreground">
                      {categoriaById.get(m.id_categoria) ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{stock}</TableCell>
                    <TableCell className="text-muted-foreground">{m.stock_minimo}</TableCell>
                    <TableCell>
                      <Badge variant={bajo ? "destructive" : "success"}>{bajo ? "Bajo" : "OK"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ver lotes de ${m.nombre}`}
                        onClick={() => setVerLotesDe(m)}
                      >
                        <Eye className="size-4" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {!isLoading && medicamentos?.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Aún no hay medicamentos registrados</p>
          </CardContent>
        </Card>
      ) : null}

      <LotesMedicamentoSheet medicamento={verLotesDe} onOpenChange={(open) => !open && setVerLotesDe(null)} />
    </div>
  );
}
