"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarClock,
  Printer,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrintDialog } from "@/components/layout/print-dialog";
import { SimpleBarChart } from "@/components/ui/simple-bar-chart";
import {
  computeProximosAVencer,
  computeStockBajo,
  diasHasta,
  fetchKardexByMedicamento,
  fetchLotes,
  type KardexMovimientoConLote,
  type StockBajoItem,
} from "@/lib/api/batches";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { fetchDetallesByVenta, fetchVentas } from "@/lib/api/sales";
import type { Lote, Medicamento, Venta } from "@/lib/types";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

function formatBs(valor: number): string {
  return `Bs. ${valor.toFixed(2)}`;
}

function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
}

interface MasVendidoItem {
  medicamento: Medicamento;
  cantidad: number;
}

/** Agrupa las ventas activas de los últimos `dias` días por fecha calendario. */
function agruparVentasPorDia(ventas: Venta[], dias: number): { label: string; value: number }[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const buckets = new Map<string, number>();
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const v of ventas) {
    if (v.estado !== "activa" && (v as any).status !== "active") continue;
    const key = (v.fecha_hora || (v as any).fecha || (v as any).sale_date || "").slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Number(v.total));
    }
  }
  return Array.from(buckets.entries())
    .map(([fecha, total]) => ({ label: formatFechaCorta(fecha), value: Math.round(total * 100) / 100 }));
}

const TIPO_META: Record<string, { label: string; icon: typeof ArrowUpCircle; className: string }> = {
  entrada: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  in: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  salida: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  out: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
  adjustment: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
};

export default function ReportesPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [ventas, setVentas] = useState<Venta[] | null>(null);
  const [masVendidos, setMasVendidos] = useState<MasVendidoItem[] | null>(null);
  const [ventanaDias, setVentanaDias] = useState("30");

  const [idMedicamentoKardex, setIdMedicamentoKardex] = useState("");

  const [printOpen, setPrintOpen] = useState<"stock-bajo" | "por-vencer" | "kardex" | null>(null);

  useEffect(() => {
    Promise.all([fetchMedicamentos(), fetchLotes(), fetchVentas()]).then(([m, l, v]) => {
      setMedicamentos(m);
      setLotes(l);
      setVentas(v);

      const activas = v.filter((venta) => venta.estado === "activa");
      Promise.all(activas.map((venta) => fetchDetallesByVenta(venta.id_venta))).then((detallesPorVenta) => {
        const cantidadPorMedicamento = new Map<number, number>();
        for (const detalles of detallesPorVenta) {
          for (const d of detalles) {
            cantidadPorMedicamento.set(
              d.id_medicamento,
              (cantidadPorMedicamento.get(d.id_medicamento) ?? 0) + d.cantidad
            );
          }
        }
        const medicamentoById = new Map(m.map((med) => [med.id_medicamento, med]));
        const top = Array.from(cantidadPorMedicamento.entries())
          .map(([id_medicamento, cantidad]) => ({ medicamento: medicamentoById.get(id_medicamento), cantidad }))
          .filter((x): x is MasVendidoItem => Boolean(x.medicamento))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);
        setMasVendidos(top);
      });
    });
  }, []);

  const stockBajo = useMemo(
    () => (medicamentos && lotes ? computeStockBajo(medicamentos, lotes) : null),
    [medicamentos, lotes]
  );

  const proximosAVencer = useMemo(
    () => (lotes ? computeProximosAVencer(lotes, Number(ventanaDias)) : null),
    [lotes, ventanaDias]
  );

  const medicamentoById = useMemo(
    () => new Map((medicamentos ?? []).map((m) => [m.id_medicamento, m])),
    [medicamentos]
  );

  const medicamentoKardexSeleccionado = medicamentos?.find(
    (m) => m.id_medicamento === Number(idMedicamentoKardex)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Apoyo a la toma de decisiones: inventario, vencimientos y trazabilidad.
        </p>
      </div>

      <Tabs defaultValue="stock-bajo">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="mas-vendidos">Más vendidos</TabsTrigger>
          <TabsTrigger value="stock-bajo">Stock bajo</TabsTrigger>
          <TabsTrigger value="por-vencer">Próximos a vencer</TabsTrigger>
          <TabsTrigger value="kardex">Kardex por medicamento</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="flex flex-col gap-4">
          {ventas === null ? (
            <Skeleton className="h-56 w-full" />
          ) : ventas.filter((v) => v.estado === "activa").length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <ShoppingBag className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Todavía no hay ventas registradas</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="mb-4 text-sm font-medium text-muted-foreground">Últimos 7 días (Bs.)</p>
                <SimpleBarChart data={agruparVentasPorDia(ventas, 7)} formatValue={formatBs} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mas-vendidos" className="flex flex-col gap-4">
          {masVendidos === null ? (
            <Skeleton className="h-56 w-full" />
          ) : masVendidos.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <TrendingUp className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Todavía no hay ventas registradas</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="mb-4 text-sm font-medium text-muted-foreground">
                  Top 5 medicamentos por unidades vendidas
                </p>
                <SimpleBarChart
                  data={masVendidos.map((x) => ({ label: x.medicamento.nombre, value: x.cantidad }))}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stock-bajo" className="flex flex-col gap-4">
          {stockBajo === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stockBajo.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <BarChart3 className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Ningún medicamento está por debajo de su stock mínimo</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => setPrintOpen("stock-bajo")}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir
              </Button>
              <StockBajoTable items={stockBajo} />
            </>
          )}
        </TabsContent>

        <TabsContent value="por-vencer" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Ventana:</p>
            <Select value={ventanaDias} onValueChange={(v) => setVentanaDias(v ?? "30")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
            {proximosAVencer && proximosAVencer.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto gap-1.5"
                onClick={() => setPrintOpen("por-vencer")}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir
              </Button>
            ) : null}
          </div>

          {proximosAVencer === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : proximosAVencer.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/60">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarClock className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Ningún lote vence dentro de esta ventana</p>
              </CardContent>
            </Card>
          ) : (
            <ProximosAVencerTable items={proximosAVencer} medicamentoById={medicamentoById} />
          )}
        </TabsContent>

        <TabsContent value="kardex" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 max-w-sm flex-1 flex-col gap-2">
              <Select value={idMedicamentoKardex} onValueChange={(v) => setIdMedicamentoKardex(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un medicamento" />
                </SelectTrigger>
                <SelectContent>
                  {(medicamentos ?? []).map((m) => (
                    <SelectItem key={m.id_medicamento} value={String(m.id_medicamento)}>
                      {m.nombre} ({m.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {idMedicamentoKardex ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPrintOpen("kardex")}
              >
                <Printer className="size-4" aria-hidden />
                Imprimir
              </Button>
            ) : null}
          </div>

          {!idMedicamentoKardex ? (
            <p className="text-sm text-muted-foreground">Selecciona un medicamento para ver su kardex.</p>
          ) : (
            <KardexTabla key={idMedicamentoKardex} idMedicamento={Number(idMedicamentoKardex)} />
          )}
        </TabsContent>
      </Tabs>

      <PrintDialog
        open={printOpen === "stock-bajo"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title="Medicamentos con stock bajo"
      >
        {stockBajo ? <StockBajoTable items={stockBajo} /> : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "por-vencer"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Lotes próximos a vencer (${ventanaDias} días)`}
      >
        {proximosAVencer ? (
          <ProximosAVencerTable items={proximosAVencer} medicamentoById={medicamentoById} />
        ) : null}
      </PrintDialog>

      <PrintDialog
        open={printOpen === "kardex"}
        onOpenChange={(open) => !open && setPrintOpen(null)}
        title={`Kardex — ${medicamentoKardexSeleccionado?.nombre ?? ""}`}
      >
        {idMedicamentoKardex ? <KardexTabla idMedicamento={Number(idMedicamentoKardex)} /> : null}
      </PrintDialog>
    </div>
  );
}

function StockBajoTable({ items }: { items: StockBajoItem[] }) {
  const columns: DataTableColumn<StockBajoItem>[] = [
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (i) => i.medicamento.nombre,
      className: "max-w-56 truncate font-medium",
    },
    {
      key: "codigo",
      header: "Código",
      accessor: (i) => i.medicamento.codigo,
      className: "whitespace-nowrap font-mono text-xs",
    },
    {
      key: "stock",
      header: "Stock actual",
      accessor: (i) => i.stock,
      className: "text-right",
    },
    {
      key: "stock_minimo",
      header: "Stock mínimo",
      accessor: (i) => i.medicamento.stock_minimo,
      className: "text-right",
    },
    {
      key: "deficit",
      header: "Déficit",
      accessor: (i) => i.medicamento.stock_minimo - i.stock,
      className: "text-right",
      render: (_, i) => <Badge variant="destructive">{i.medicamento.stock_minimo - i.stock}</Badge>,
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar medicamento…"
      emptyMessage="No se encontraron medicamentos."
    />
  );
}

function ProximosAVencerTable({
  items,
  medicamentoById,
}: {
  items: Lote[];
  medicamentoById: Map<number, Medicamento>;
}) {
  const columns: DataTableColumn<Lote>[] = [
    {
      key: "medicamento",
      header: "Medicamento",
      accessor: (l) => medicamentoById.get(l.id_medicamento)?.nombre ?? null,
      className: "max-w-56 truncate font-medium",
    },
    {
      key: "numero_lote",
      header: "N° Lote",
      accessor: (l) => l.numero_lote,
      className: "whitespace-nowrap font-mono text-xs",
    },
    {
      key: "fecha_vencimiento",
      header: "Vencimiento",
      accessor: (l) => l.fecha_vencimiento,
      className: "whitespace-nowrap",
    },
    {
      key: "dias",
      header: "Días",
      accessor: (l) => diasHasta(l.fecha_vencimiento),
      render: (_, l) => {
        const dias = diasHasta(l.fecha_vencimiento);
        return (
          <Badge variant={dias < 0 ? "destructive" : "warning"}>
            {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : `${dias} d.`}
          </Badge>
        );
      },
    },
    {
      key: "cantidad_actual",
      header: "Cantidad",
      accessor: (l) => l.cantidad_actual,
      className: "text-right",
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Buscar por medicamento o N° de lote…"
      emptyMessage="No se encontraron lotes."
    />
  );
}

function KardexTabla({ idMedicamento }: { idMedicamento: number }) {
  const [kardex, setKardex] = useState<KardexMovimientoConLote[] | null>(null);

  useEffect(() => {
    fetchKardexByMedicamento(idMedicamento).then(setKardex);
  }, [idMedicamento]);

  if (kardex === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (kardex.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin movimientos registrados para este medicamento.</p>;
  }

  const columns: DataTableColumn<any>[] = [
    {
      key: "tipo",
      header: "Tipo",
      accessor: (k: any) => TIPO_META[k.tipo || k.type]?.label || k.tipo || k.type,
      render: (_, k: any) => {
        const meta = TIPO_META[k.tipo || k.type] || { label: k.tipo || k.type, icon: SlidersHorizontal, className: "text-muted-foreground" };
        const Icon = meta.icon;
        return (
          <span className={`flex items-center gap-1.5 whitespace-nowrap ${meta.className}`}>
            <Icon className="size-4" aria-hidden />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "numero_lote",
      header: "N° Lote",
      accessor: (k: any) => k.numero_lote || k.batch_number || "—",
      className: "whitespace-nowrap font-mono text-xs",
    },
    {
      key: "cantidad",
      header: "Cantidad",
      accessor: (k: any) => k.cantidad ?? k.quantity,
      render: (_, k: any) => {
        const cant = Number(k.cantidad ?? k.quantity ?? 0);
        const meta = TIPO_META[k.tipo || k.type] || { className: "" };
        return (
          <span className={`whitespace-nowrap font-medium ${meta.className}`}>
            {cant > 0 ? "+" : ""}
            {cant}
          </span>
        );
      },
      className: "text-right",
    },
    {
      key: "saldo",
      header: "Saldo",
      accessor: (k: any) => k.saldo ?? k.balance,
      className: "text-right",
    },
    {
      key: "motivo",
      header: "Motivo",
      accessor: (k: any) => k.motivo || k.reason || "—",
      className: "max-w-48 truncate",
    },
    {
      key: "fecha",
      header: "Fecha",
      accessor: (k: any) => k.fecha || k.fecha_hora || k.occurred_at || "",
      className: "whitespace-nowrap text-muted-foreground",
      render: (_, k: any) => formatFecha(k.fecha || k.fecha_hora || k.occurred_at || ""),
    },
  ];

  return (
    <DataTable
      data={kardex}
      columns={columns}
      searchPlaceholder="Buscar por N° de lote o motivo…"
      emptyMessage="No se encontraron movimientos."
    />
  );
}
