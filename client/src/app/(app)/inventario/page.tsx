"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { fetchCategorias } from "@/lib/api/catalogs";
import { fetchLotes } from "@/lib/api/batches";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import type { Categoria, Lote, Medicamento } from "@/lib/types";
import { MedicamentBatchesSheet } from "./medicament-batches-sheet";

export default function InventarioPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
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

  const isLoading = medicamentos === null;
  const hasAny = (medicamentos?.length ?? 0) > 0;

  const columns: DataTableColumn<Medicamento>[] = [
    {
      key: "nombre",
      header: "Medicamento",
      accessor: (m) => m.nombre,
      className: "max-w-56",
      render: (_, m) => (
        <span className="block truncate" title={m.nombre}>
          {m.nombre}
          <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">{m.codigo}</span>
        </span>
      ),
    },
    {
      key: "categoria",
      header: "Categoría",
      accessor: (m) => categoriaById.get(m.id_categoria) ?? null,
      className: "max-w-32 truncate text-muted-foreground",
    },
    {
      key: "stock_actual",
      header: "Stock actual",
      accessor: (m) => stockPorMedicamento.get(m.id_medicamento) ?? 0,
      className: "text-right font-medium",
    },
    {
      key: "stock_minimo",
      header: "Stock mínimo",
      accessor: (m) => m.stock_minimo,
      className: "text-right text-muted-foreground",
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (m) => {
        const stock = stockPorMedicamento.get(m.id_medicamento) ?? 0;
        return stock < m.stock_minimo ? "Bajo" : "OK";
      },
      render: (_, m) => {
        const stock = stockPorMedicamento.get(m.id_medicamento) ?? 0;
        const bajo = stock < m.stock_minimo;
        return <Badge variant={bajo ? "destructive" : "success"}>{bajo ? "Bajo" : "OK"}</Badge>;
      },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, m) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ver lotes de ${m.nombre}`}
          onClick={() => setVerLotesDe(m)}
        >
          <Eye className="size-4" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Consulta de Inventario</h1>
        <p className="text-sm text-muted-foreground">Stock disponible por medicamento, con detalle por lote.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : hasAny ? (
        <DataTable
          data={medicamentos ?? []}
          columns={columns}
          searchPlaceholder="Buscar por nombre o código…"
          emptyMessage="No se encontraron medicamentos."
        />
      ) : null}

      {!isLoading && !hasAny ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Aún no hay medicamentos registrados</p>
          </CardContent>
        </Card>
      ) : null}

      <MedicamentBatchesSheet
        medicamento={verLotesDe}
        lotes={lotes ?? []}
        open={Boolean(verLotesDe)}
        onOpenChange={(open) => !open && setVerLotesDe(null)}
      />
    </div>
  );
}
