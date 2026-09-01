"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import {
  getPaginated,
  remove,
  bulkDestroy,
  restore,
  update,
  exportResource,
  disposeBatch,
  restoreStock,
  computeProximosAVencer,
  computeStockBajo,
  diasHasta,
  DIAS_ALERTA_VENCIMIENTO,
} from "@/lib/api/batches";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency } from "@/lib/format";
import type { IBatch, BatchTableEditableField } from "@/lib/types/batch";
import type { Lote, Medicamento } from "@/lib/types";
import { BatchFormDialog } from "./batch-form-dialog";
import { DisposeBatchDialog } from "./dispose-batch-dialog";
import { KardexSheet } from "./kardex-sheet";
import { cn } from "@/lib/utils";

// Parámetros por defecto para la consulta paginada
const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: { key: "expiration_date", direction: "asc" },
};

export default function LotesPage() {
  const { can } = useAuth();
  // Estados para datos, paginación y carga
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<IBatch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Catálogo de medicamentos para referencias y alertas
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  // Estados de formularios y acciones
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IBatch | null>(null);
  const [bajaTarget, setBajaTarget] = useState<Lote | null>(null);
  const [kardexTarget, setKardexTarget] = useState<Lote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IBatch | null>(null);
  const [selectedRows, setSelectedRows] = useState<IBatch[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectionClearKey, setSelectionClearKey] = useState(0);

  // Carga inicial de medicamentos
  useEffect(() => {
    fetchMedicamentos().then(setMedicamentos);
  }, []);

  // Mapeo para búsqueda rápida de medicamento por ID
  const medicamentoById = useMemo(
    () => new Map(medicamentos.map((m) => [m.id_medicamento, m])),
    [medicamentos]
  );

  // Adaptación de lotes para cálculo de alertas en frontend
  const lotesParaAlertas = useMemo<Lote[]>(() => {
    return items
      .filter((b) => !b.deleted_at)
      .map((b) => ({
        ...b,
        id_lote: b.id,
        numero_lote: b.batch_number,
        fecha_vencimiento: b.expiration_date ? b.expiration_date.slice(0, 10) : "",
        cantidad_actual: b.current_quantity,
        precio_compra: Number(b.purchase_price),
        id_medicamento: b.medicament_id,
      }));
  }, [items]);

  const alertaVencimiento = useMemo(
    () => computeProximosAVencer(lotesParaAlertas),
    [lotesParaAlertas]
  );

  const alertaStockBajo = useMemo(
    () => computeStockBajo(medicamentos, lotesParaAlertas),
    [medicamentos, lotesParaAlertas]
  );

  // Función para recargar la tabla
  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Manejador de cambio de parámetros de tabla
  const paramsRef = useRef(params);
  const handleParamsChange = useCallback((next: ServerFetchParams) => {
    const searchChanged = paramsRef.current.search !== next.search;
    paramsRef.current = next;
    if (!searchChanged) setLoading(true);
    setParams(next);
  }, []);

  // Consulta de lotes desde la API
  useEffect(() => {
    const controller = new AbortController();

    getPaginated(
      {
        page: params.page,
        per_page: params.pageSize,
        search: params.search,
        sort_by: params.sort?.key || "expiration_date",
        sort_dir: params.sort?.direction || "asc",
      },
      controller.signal
    )
      .then((result) => {
        setItems(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setError(null);
        if (result.data.length === 0 && result.meta?.total > 0 && params.page > 1) {
          setParams((p) => ({ ...p, page: p.page - 1 }));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.message || err?.message || "Error al cargar los lotes.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, refreshKey]);

  // Apertura de modal de creación
  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  // Apertura de modal de edición
  function openEdit(lote: IBatch) {
    if (lote.deleted_at) return;
    setEditing(lote);
    setFormOpen(true);
  }

  // Restauración de un lote eliminado lógicamente
  async function handleRestore(lote: IBatch) {
    try {
      await restore(lote.id);
      toast.success("Lote restaurado con éxito.");
      refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo restaurar el lote."
      );
    }
  }

  // Notificación y recarga al guardar cambios en formulario
  function handleSaved() {
    const wasEditing = Boolean(editing);
    toast.success(wasEditing ? "Lote actualizado." : "Lote creado.");
    refresh();
  }

  // Edición rápida en celda de la tabla
  async function saveField(batch: IBatch, field: BatchTableEditableField, value: string | number) {
    if (batch.deleted_at) return;
    await update(batch.id, {
      [field]: field === "purchase_price" ? Number(value) : value,
    });
    refresh();
  }

  // Definición de columnas de la tabla de lotes
  const columns: DataTableColumn<IBatch>[] = [
    {
      key: "medicament",
      header: "Medicamento",
      accessor: (l) => l.medicament?.name || medicamentoById.get(l.medicament_id)?.nombre || "-",
      resizable: true,
      width: 220,
      render: (_, l) => {
        const medName = l.medicament?.name || medicamentoById.get(l.medicament_id)?.nombre || `Medicamento #${l.medicament_id}`;
        const medCode = l.medicament?.code || medicamentoById.get(l.medicament_id)?.codigo;
        return (
          <div className="flex flex-col min-w-0">
            <span className={cn("font-medium text-xs truncate", l.deleted_at && "text-destructive line-through")}>
              {medName}
            </span>
            {medCode && (
              <span className={cn("font-mono text-[11px] text-muted-foreground", l.deleted_at && "line-through")}>
                {medCode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "batch_number",
      header: "N° de Lote",
      accessor: (l) => l.batch_number,
      resizable: true,
      width: 150,
      edit: { onSave: (l, v) => saveField(l, "batch_number", String(v)) },
      render: (_, l) => (
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-xs font-medium", l.deleted_at && "text-destructive line-through")}>
            {l.batch_number}
          </span>
          {l.deleted_at && (
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
              Eliminado
            </span>
          )}
        </div>
      ),
    },
    {
      key: "expiration_date",
      header: "Vencimiento",
      accessor: (l) => l.expiration_date,
      resizable: true,
      width: 170,
      render: (_, l) => {
        const dateStr = l.expiration_date ? l.expiration_date.slice(0, 10) : "";
        const dias = diasHasta(dateStr);
        const vencido = dias < 0;
        const porVencer = !vencido && dias <= DIAS_ALERTA_VENCIMIENTO;

        return (
          <div className="flex items-center gap-2">
            <span className={cn("whitespace-nowrap text-xs", l.deleted_at && "text-destructive line-through")}>
              {dateStr}
            </span>
            {!l.deleted_at && (
              <>
                {vencido ? (
                  <Badge variant="destructive" className="text-[10px]">Vencido</Badge>
                ) : porVencer ? (
                  <Badge variant="warning" className="text-[10px]">Por vencer</Badge>
                ) : null}
              </>
            )}
          </div>
        );
      },
    },
    {
      key: "current_quantity",
      header: "Stock Actual",
      accessor: (l) => l.current_quantity,
      resizable: true,
      width: 120,
      className: "text-right",
      render: (_, l) => (
        <span className={cn("font-mono text-xs font-medium", l.deleted_at && "text-destructive line-through")}>
          {l.current_quantity}
        </span>
      ),
    },
    {
      key: "purchase_price",
      header: "Precio Compra",
      accessor: (l) => Number(l.purchase_price),
      resizable: true,
      width: 130,
      className: "text-right",
      edit: { type: "number", onSave: (l, v) => saveField(l, "purchase_price", Number(v)) },
      render: (_, l) => (
        <span className={cn("font-medium text-xs", l.deleted_at && "text-destructive line-through")}>
          {formatCurrency(Number(l.purchase_price))}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      accessor: () => null,
      sortable: false,
      filterable: false,
      resizable: false,
      className: "w-28",
      render: (_, l) => {
        if (l.deleted_at) {
          if (!can(PERMISSIONS.RESTORE_BATCHES)) return null;
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
                onClick={() => handleRestore(l)}
                title="Restaurar lote"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>
          );
        }

        const loteLegacy: Lote = {
          ...l,
          id_lote: l.id,
          numero_lote: l.batch_number,
          fecha_vencimiento: l.expiration_date ? l.expiration_date.slice(0, 10) : "",
          cantidad_actual: l.current_quantity,
          precio_compra: Number(l.purchase_price),
          id_medicamento: l.medicament_id,
        };

        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones para ${l.batch_number}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can(PERMISSIONS.EDIT_BATCHES) && (
                  <DropdownMenuItem onClick={() => openEdit(l)}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setKardexTarget(loteLegacy)}>
                  <History className="size-4" aria-hidden />
                  Ver kardex
                </DropdownMenuItem>
                {can(PERMISSIONS.DISPOSE_BATCHES) && (
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={l.current_quantity === 0}
                    onClick={() => setBajaTarget(loteLegacy)}
                  >
                    <AlertTriangle className="size-4" aria-hidden />
                    Dar de baja
                  </DropdownMenuItem>
                )}
                {can(PERMISSIONS.DELETE_BATCHES) && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(l)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Encabezado del módulo */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de Lotes
          </h1>
          <p className="text-sm text-muted-foreground">
            Stock por lote, fechas de caducidad, trazabilidad de kardex y bajas de inventario.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.DELETE_BATCHES) && selectedRows.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              className="shrink-0 gap-1.5"
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar seleccionados ({selectedRows.length})
            </Button>
          )}
          {can(PERMISSIONS.CREATE_BATCHES) && (
            <Button
              type="button"
              onClick={openCreate}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Lote
            </Button>
          )}
        </div>
      </div>

      {/* Tarjetas informativas de alertas de inventario */}
      {(alertaVencimiento.length > 0 || alertaStockBajo.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {alertaVencimiento.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
                <CalendarClock className="size-4 text-warning" aria-hidden />
                <CardTitle className="text-sm font-medium">
                  {alertaVencimiento.length} lote(s) vencido(s) o próximos a vencer
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-xs">
                {alertaVencimiento.slice(0, 3).map((l: any) => {
                  const dias = diasHasta(l.fecha_vencimiento);
                  return (
                    <div key={l.id_lote || l.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">
                        {medicamentoById.get(l.id_medicamento || l.medicament_id)?.nombre} — {l.numero_lote || l.batch_number}
                      </span>
                      <span className="shrink-0 font-medium text-muted-foreground">
                        {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : `${dias} d.`}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {alertaStockBajo.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
                <AlertTriangle className="size-4 text-destructive" aria-hidden />
                <CardTitle className="text-sm font-medium">
                  {alertaStockBajo.length} medicamento(s) con stock bajo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-xs">
                {alertaStockBajo.slice(0, 3).map(({ medicamento, stock }: any) => (
                  <div key={medicamento.id_medicamento || medicamento.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{medicamento.nombre || medicamento.name}</span>
                    <span className="shrink-0 font-medium text-muted-foreground">
                      {stock} / mín. {medicamento.stock_minimo || medicamento.min_stock}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabla de datos principal */}
      <DataTable
        data={items}
        columns={columns}
        server={{
          params,
          onParamsChange: handleParamsChange,
          total,
          loading,
          error,
          onRetry: refresh,
        }}
        getRowClassName={(l) =>
          l.deleted_at
            ? "bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/20"
            : undefined
        }
        searchPlaceholder="Buscar por código de medicamento o número de lote…"
        emptyMessage="No se encontraron lotes registrados."
        pageSizeOptions={[10, 20, 50, 100]}
        exportFilename="lotes.csv"
        onExport={can(PERMISSIONS.EXPORT_BATCHES) ? exportResource : undefined}
        onRefresh={refresh}
        getRowId={(l) => l.id}
        onSelectionChange={can(PERMISSIONS.DELETE_BATCHES) ? setSelectedRows : undefined}
        clearSelectionKey={selectionClearKey}
        enableColumnDrag={true}
        enableRowDrag={false}
        persistPreferences={true}
        storageKey="lotes-table"
        minColumnWidth={80}
      />

      {/* Modal de formulario para crear/editar */}
      <BatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        batch={editing}
        medicamentos={medicamentos}
        onSaved={handleSaved}
      />

      {/* Modal para dar de baja stock */}
      <DisposeBatchDialog
        open={Boolean(bajaTarget)}
        onOpenChange={(open) => !open && setBajaTarget(null)}
        lote={bajaTarget}
        nombreMedicamento={bajaTarget ? (medicamentoById.get(bajaTarget.id_medicamento)?.nombre || `Medicamento #${bajaTarget.id_medicamento}`) : ""}
        onConfirm={async (cantidad, motivo, notas) => {
          if (!bajaTarget) return;
          await disposeBatch(bajaTarget.id_lote || (bajaTarget as any).id, { cantidad, motivo, notas });
          toast.success("Stock dado de baja con éxito.");
          refresh();
        }}
      />

      {/* Panel lateral para visualizar Kardex */}
      <KardexSheet
        lote={kardexTarget}
        onOpenChange={(open) => !open && setKardexTarget(null)}
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar lote?"
        description={
          <>
            Se eliminará el lote <strong>{deleteTarget?.batch_number}</strong> del catálogo.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          toast.success("Lote eliminado.");
          refresh();
        }}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`¿Eliminar ${selectedRows.length} lote(s)?`}
        description={
          <>
            Se eliminarán{" "}
            <strong>{selectedRows.length} lote(s) seleccionado(s)</strong> del catálogo.
          </>
        }
        onConfirm={async () => {
          if (selectedRows.length === 0) return;
          const result = await bulkDestroy(
            selectedRows.map((l) => l.id)
          );
          toast.success(result.message || "Lotes eliminados.");
          setSelectionClearKey((k) => k + 1);
          refresh();
        }}
      />
    </div>
  );
}
