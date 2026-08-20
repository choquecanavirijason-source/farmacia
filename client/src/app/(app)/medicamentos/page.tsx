"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Pill, Plus, ScanLine, Search, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchCategorias,
  fetchLaboratorios,
  fetchMedicamentos,
  fetchPresentaciones,
} from "@/lib/api/medicamentos";
import { formatCurrency } from "@/lib/format";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/layout/table-pagination";
import type { Categoria, Laboratorio, Medicamento, Presentacion } from "@/lib/types";
import { MedicamentoFormDialog } from "@/app/(app)/medicamentos/medicamento-form-dialog";
import { DeleteMedicamentoDialog } from "@/app/(app)/medicamentos/delete-medicamento-dialog";

export default function MedicamentosPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Medicamento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medicamento | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetchMedicamentos(), fetchCategorias(), fetchPresentaciones(), fetchLaboratorios()]).then(
      ([medicamentosData, categoriasData, presentacionesData, laboratoriosData]) => {
        setMedicamentos(medicamentosData);
        setCategorias(categoriasData);
        setPresentaciones(presentacionesData);
        setLaboratorios(laboratoriosData);
      }
    );
  }, []);

  const categoriaById = useMemo(
    () => new Map(categorias.map((c) => [c.id_categoria, c.nombre])),
    [categorias]
  );
  const laboratorioById = useMemo(
    () => new Map(laboratorios.map((l) => [l.id_laboratorio, l.nombre])),
    [laboratorios]
  );

  const filtered = useMemo(() => {
    if (!medicamentos) return null;
    const query = search.trim().toLowerCase();
    if (!query) return medicamentos;
    return medicamentos.filter(
      (m) => m.nombre.toLowerCase().includes(query) || m.codigo.toLowerCase().includes(query)
    );
  }, [medicamentos, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(medicamento: Medicamento) {
    setEditing(medicamento);
    setFormOpen(true);
  }

  function handleSaved(saved: Medicamento) {
    const wasEditing = Boolean(editing);
    setMedicamentos((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((m) => m.id_medicamento === saved.id_medicamento);
      return exists
        ? prev.map((m) => (m.id_medicamento === saved.id_medicamento ? saved : m))
        : [...prev, saved];
    });
    toast.success(wasEditing ? "Medicamento actualizado." : "Medicamento creado.");
  }

  function handleDeleted(id: number) {
    setMedicamentos((prev) => (prev ? prev.filter((m) => m.id_medicamento !== id) : prev));
    setDeleteTarget(null);
    toast.success("Medicamento eliminado.");
  }

  function handleScanClick() {
    searchInputRef.current?.focus();
    toast.info("El escaneo por código de barras estará disponible al conectar un lector.");
  }

  const isLoading = medicamentos === null;
  const hasAnyMedicamento = (medicamentos?.length ?? 0) > 0;
  const hasResults = (filtered?.length ?? 0) > 0;
  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Medicamentos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de medicamentos: código, precio, stock mínimo y receta.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="pl-8"
            aria-label="Buscar medicamentos"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleScanClick}
            aria-label="Escanear código de barras"
            title="Escanear código de barras"
          >
            <ScanLine className="size-4" aria-hidden />
          </Button>
          <Button type="button" onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" aria-hidden />
            Nuevo Medicamento
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Laboratorio</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock mín.</TableHead>
                <TableHead>Receta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !hasAnyMedicamento ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Pill className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Aún no hay medicamentos registrados</p>
              <p className="max-w-sm text-xs text-balance text-muted-foreground">
                Registra tu primer medicamento para empezar a controlar el inventario.
              </p>
            </div>
            <Button type="button" onClick={openCreate} className="mt-2 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nuevo Medicamento
            </Button>
          </CardContent>
        </Card>
      ) : !hasResults ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Sin resultados</p>
              <p className="max-w-sm text-xs text-balance text-muted-foreground">
                No encontramos medicamentos para “{search}”.
              </p>
            </div>
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
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Laboratorio</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock mín.</TableHead>
                <TableHead>Receta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems?.map((m) => (
                <TableRow key={m.id_medicamento}>
                  <TableCell className="max-w-28 truncate font-mono text-xs" title={m.codigo}>
                    {m.codigo}
                  </TableCell>
                  <TableCell className="max-w-56 truncate font-medium" title={m.nombre}>
                    {m.nombre}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {m.concentracion}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-32 truncate" title={categoriaById.get(m.id_categoria)}>
                    {categoriaById.get(m.id_categoria) ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-32 truncate" title={laboratorioById.get(m.id_laboratorio)}>
                    {laboratorioById.get(m.id_laboratorio) ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">{formatCurrency(m.precio_venta)}</TableCell>
                  <TableCell className="text-right">{m.stock_minimo}</TableCell>
                  <TableCell>
                    <Badge variant={m.requiere_receta ? "outline" : "secondary"}>
                      {m.requiere_receta ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.estado === "activo" ? "success" : "secondary"}>
                      {m.estado === "activo" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${m.nombre}`} />
                        }
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(m)}>
                          <Pencil className="size-4" aria-hidden />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(m)}>
                          <Trash2 className="size-4" aria-hidden />
                          Eliminar
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

      <MedicamentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        medicamento={editing}
        categorias={categorias}
        presentaciones={presentaciones}
        laboratorios={laboratorios}
        onSaved={handleSaved}
      />

      <DeleteMedicamentoDialog
        medicamento={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
