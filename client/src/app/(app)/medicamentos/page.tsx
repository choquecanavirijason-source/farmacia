"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Pill, Plus, ScanLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type DataTableColumn,
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
  updateMedicamento,
} from "@/lib/api/medicamentos";
import { formatCurrency } from "@/lib/format";
import type { Categoria, Laboratorio, Medicamento, Presentacion } from "@/lib/types";
import { MedicamentoFormDialog } from "@/app/(app)/medicamentos/medicamento-form-dialog";
import { DeleteMedicamentoDialog } from "@/app/(app)/medicamentos/delete-medicamento-dialog";

export default function MedicamentosPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Medicamento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medicamento | null>(null);

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

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(medicamento: Medicamento) {
    setEditing(medicamento);
    setFormOpen(true);
  }

  function upsertMedicamento(saved: Medicamento) {
    setMedicamentos((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((m) => m.id_medicamento === saved.id_medicamento);
      return exists
        ? prev.map((m) => (m.id_medicamento === saved.id_medicamento ? saved : m))
        : [...prev, saved];
    });
  }

  function handleSaved(saved: Medicamento) {
    const wasEditing = Boolean(editing);
    upsertMedicamento(saved);
    toast.success(wasEditing ? "Medicamento actualizado." : "Medicamento creado.");
  }

  async function saveField(
    m: Medicamento,
    field: "codigo" | "nombre" | "precio_venta" | "stock_minimo",
    value: string | number
  ) {
    const updated = await updateMedicamento(m.id_medicamento, {
      codigo: field === "codigo" ? String(value) : m.codigo,
      nombre: field === "nombre" ? String(value) : m.nombre,
      concentracion: m.concentracion,
      precio_venta: field === "precio_venta" ? Number(value) : m.precio_venta,
      stock_minimo: field === "stock_minimo" ? Number(value) : m.stock_minimo,
      requiere_receta: m.requiere_receta,
      estado: m.estado,
      id_categoria: m.id_categoria,
      id_presentacion: m.id_presentacion,
      id_laboratorio: m.id_laboratorio,
    });
    upsertMedicamento(updated);
  }

  function handleDeleted(id: number) {
    setMedicamentos((prev) => (prev ? prev.filter((m) => m.id_medicamento !== id) : prev));
    setDeleteTarget(null);
    toast.success("Medicamento eliminado.");
  }

  function handleScanClick() {
    toast.info("El escaneo por código de barras estará disponible al conectar un lector.");
  }

  const isLoading = medicamentos === null;
  const hasAnyMedicamento = (medicamentos?.length ?? 0) > 0;

  const columns: DataTableColumn<Medicamento>[] = [
    {
      key: "codigo",
      header: "Código",
      accessor: (m) => m.codigo,
      className: "max-w-28 truncate font-mono text-xs",
      edit: { onSave: (m, value) => saveField(m, "codigo", value) },
    },
    {
      key: "nombre",
      header: "Nombre",
      accessor: (m) => m.nombre,
      className: "max-w-56",
      edit: { onSave: (m, value) => saveField(m, "nombre", value) },
      render: (_, m) => (
        <span className="block truncate" title={m.nombre}>
          {m.nombre}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{m.concentracion}</span>
        </span>
      ),
    },
    {
      key: "categoria",
      header: "Categoría",
      accessor: (m) => categoriaById.get(m.id_categoria) ?? null,
      className: "max-w-32 truncate",
    },
    {
      key: "laboratorio",
      header: "Laboratorio",
      accessor: (m) => laboratorioById.get(m.id_laboratorio) ?? null,
      className: "max-w-32 truncate",
    },
    {
      key: "precio_venta",
      header: "Precio",
      accessor: (m) => m.precio_venta,
      className: "whitespace-nowrap text-right",
      render: (_, m) => formatCurrency(m.precio_venta),
      edit: { type: "number", onSave: (m, value) => saveField(m, "precio_venta", value) },
    },
    {
      key: "stock_minimo",
      header: "Stock mín.",
      accessor: (m) => m.stock_minimo,
      className: "text-right",
      edit: { type: "number", onSave: (m, value) => saveField(m, "stock_minimo", value) },
    },
    {
      key: "requiere_receta",
      header: "Receta",
      accessor: (m) => (m.requiere_receta ? "Sí" : "No"),
      render: (_, m) => (
        <Badge variant={m.requiere_receta ? "outline" : "secondary"}>{m.requiere_receta ? "Sí" : "No"}</Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (m) => m.estado,
      render: (_, m) => (
        <Badge variant={m.estado === "activo" ? "success" : "secondary"}>
          {m.estado === "activo" ? "Activo" : "Inactivo"}
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
      render: (_, m) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${m.nombre}`} />}
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
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Medicamentos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de medicamentos: código, precio, stock mínimo y receta.
          </p>
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
      ) : (
        <DataTable
          data={medicamentos ?? []}
          columns={columns}
          searchPlaceholder="Buscar por nombre o código…"
          emptyMessage="No se encontraron medicamentos."
        />
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
