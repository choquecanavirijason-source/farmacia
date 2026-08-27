"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import {
  computeProximosAVencer,
  computeStockBajo,
  deleteLote,
  diasHasta,
  fetchLotes,
  updateLote,
  DIAS_ALERTA_VENCIMIENTO,
} from "@/lib/api/lotes";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import type { Lote, Medicamento } from "@/lib/types";
import { LoteFormDialog } from "@/app/(app)/lotes/lote-form-dialog";
import { DarDeBajaDialog } from "@/app/(app)/lotes/dar-de-baja-dialog";
import { KardexSheet } from "@/app/(app)/lotes/kardex-sheet";

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lote | null>(null);
  const [bajaTarget, setBajaTarget] = useState<Lote | null>(null);
  const [kardexTarget, setKardexTarget] = useState<Lote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lote | null>(null);

  useEffect(() => {
    Promise.all([fetchLotes(), fetchMedicamentos()]).then(([lotesData, medicamentosData]) => {
      setLotes(lotesData);
      setMedicamentos(medicamentosData);
    });
  }, []);

  const medicamentoById = useMemo(
    () => new Map(medicamentos.map((m) => [m.id_medicamento, m])),
    [medicamentos]
  );

  const alertaVencimiento = useMemo(() => (lotes ? computeProximosAVencer(lotes) : []), [lotes]);

  const alertaStockBajo = useMemo(
    () => (lotes ? computeStockBajo(medicamentos, lotes) : []),
    [lotes, medicamentos]
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(lote: Lote) {
    setEditing(lote);
    setFormOpen(true);
  }

  function upsertLote(saved: Lote) {
    setLotes((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((l) => l.id_lote === saved.id_lote);
      return exists ? prev.map((l) => (l.id_lote === saved.id_lote ? saved : l)) : [...prev, saved];
    });
  }

  function handleSaved(saved: Lote) {
    const wasEditing = Boolean(editing);
    upsertLote(saved);
    toast.success(wasEditing ? "Lote actualizado." : "Lote creado.");
  }

  function handleAdjusted(saved: Lote) {
    upsertLote(saved);
    toast.success("Stock dado de baja.");
  }

  async function saveField(l: Lote, field: "numero_lote" | "precio_compra", value: string | number) {
    const updated = await updateLote(l.id_lote, {
      numero_lote: field === "numero_lote" ? String(value) : l.numero_lote,
      fecha_vencimiento: l.fecha_vencimiento,
      precio_compra: field === "precio_compra" ? Number(value) : l.precio_compra,
      id_medicamento: l.id_medicamento,
    });
    upsertLote(updated);
  }

  const isLoading = lotes === null;
  const hasAnyLote = (lotes?.length ?? 0) > 0;

  const columns: DataTableColumn<Lote>[] = [
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (l) => medicamentoById.get(l.id_medicamento)?.nombre ?? null,
      className: "max-w-52 truncate font-medium",
    },
    {
      key: "numero_lote",
      header: "N° Lote",
      accessor: (l) => l.numero_lote,
      className: "max-w-32 truncate font-mono text-xs",
      edit: { onSave: (l, value) => saveField(l, "numero_lote", value) },
    },
    {
      key: "fecha_vencimiento",
      header: "Vencimiento",
      accessor: (l) => l.fecha_vencimiento,
      render: (_, l) => {
        const dias = diasHasta(l.fecha_vencimiento);
        const vencido = dias < 0;
        const porVencer = !vencido && dias <= DIAS_ALERTA_VENCIMIENTO;
        return (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">{l.fecha_vencimiento}</span>
            {vencido ? (
              <Badge variant="destructive">Vencido</Badge>
            ) : porVencer ? (
              <Badge variant="warning">Por vencer</Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "cantidad_actual",
      header: "Cantidad",
      accessor: (l) => l.cantidad_actual,
      className: "text-right",
    },
    {
      key: "precio_compra",
      header: "Precio compra",
      accessor: (l) => l.precio_compra,
      className: "whitespace-nowrap text-right",
      render: (_, l) => `Bs ${l.precio_compra.toFixed(2)}`,
      edit: { type: "number", onSave: (l, value) => saveField(l, "precio_compra", value) },
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, l) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Acciones para el lote ${l.numero_lote}`} />
            }
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(l)}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setKardexTarget(l)}>
              <History className="size-4" aria-hidden />
              Ver kardex
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={l.cantidad_actual === 0}
              onSelect={() => setBajaTarget(l)}
            >
              <AlertTriangle className="size-4" aria-hidden />
              Dar de baja
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={l.cantidad_actual > 0}
              onSelect={() => setDeleteTarget(l)}
            >
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
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Lotes</h1>
          <p className="text-sm text-muted-foreground">
            Stock por lote, trazabilidad de kardex y alertas de vencimiento.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0 gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nuevo Lote
        </Button>
      </div>

      {!isLoading && (alertaVencimiento.length > 0 || alertaStockBajo.length > 0) ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {alertaVencimiento.length > 0 ? (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <CalendarClock className="size-4 text-warning" aria-hidden />
                <CardTitle className="text-sm font-medium">
                  {alertaVencimiento.length} lote(s) vencido(s) o por vencer
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm">
                {alertaVencimiento.slice(0, 4).map((l) => {
                  const dias = diasHasta(l.fecha_vencimiento);
                  return (
                    <div key={l.id_lote} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">
                        {medicamentoById.get(l.id_medicamento)?.nombre} — {l.numero_lote}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : `${dias} d.`}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          {alertaStockBajo.length > 0 ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <AlertTriangle className="size-4 text-destructive" aria-hidden />
                <CardTitle className="text-sm font-medium">
                  {alertaStockBajo.length} medicamento(s) con stock bajo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm">
                {alertaStockBajo.slice(0, 4).map(({ medicamento, stock }) => (
                  <div key={medicamento.id_medicamento} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{medicamento.nombre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stock} / mín. {medicamento.stock_minimo}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>N° Lote</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio compra</TableHead>
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
      ) : !hasAnyLote ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Boxes className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Aún no hay lotes registrados</p>
              <p className="max-w-sm text-xs text-balance text-muted-foreground">
                Registra el primer lote de un medicamento para empezar a controlar su stock.
              </p>
            </div>
            <Button type="button" onClick={openCreate} className="mt-2 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nuevo Lote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={lotes ?? []}
          columns={columns}
          searchPlaceholder="Buscar por medicamento o N° de lote…"
          emptyMessage="No se encontraron lotes."
        />
      )}

      <LoteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lote={editing}
        medicamentos={medicamentos}
        onSaved={handleSaved}
      />

      <DarDeBajaDialog
        lote={bajaTarget}
        onOpenChange={(open) => !open && setBajaTarget(null)}
        onAdjusted={handleAdjusted}
      />

      <KardexSheet lote={kardexTarget} onOpenChange={(open) => !open && setKardexTarget(null)} />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar lote?"
        description={
          <>
            Se eliminará el lote <strong>{deleteTarget?.numero_lote}</strong>. Esta acción no se puede
            deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteLote(deleteTarget.id_lote);
          setLotes((prev) => (prev ? prev.filter((l) => l.id_lote !== deleteTarget.id_lote) : prev));
          toast.success("Lote eliminado.");
        }}
      />
    </div>
  );
}
