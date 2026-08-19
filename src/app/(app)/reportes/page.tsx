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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PrintDialog } from "@/components/layout/print-dialog";
import {
  computeProximosAVencer,
  computeStockBajo,
  diasHasta,
  fetchKardexByMedicamento,
  fetchLotes,
  type KardexMovimientoConLote,
  type StockBajoItem,
} from "@/lib/api/lotes";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import type { Lote, Medicamento } from "@/lib/types";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

const TIPO_META = {
  entrada: { label: "Entrada", icon: ArrowUpCircle, className: "text-success" },
  salida: { label: "Salida", icon: ArrowDownCircle, className: "text-destructive" },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, className: "text-warning" },
} as const;

export default function ReportesPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [ventanaDias, setVentanaDias] = useState("30");

  const [idMedicamentoKardex, setIdMedicamentoKardex] = useState("");

  const [printOpen, setPrintOpen] = useState<"stock-bajo" | "por-vencer" | "kardex" | null>(null);

  useEffect(() => {
    Promise.all([fetchMedicamentos(), fetchLotes()]).then(([m, l]) => {
      setMedicamentos(m);
      setLotes(l);
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

        <TabsContent value="ventas">
          <ModulePlaceholder
            title="Ventas del día / por rango"
            description="Este reporte se arma con los datos del módulo de Ventas, todavía pendiente de construir."
            icon={ShoppingBag}
          />
        </TabsContent>

        <TabsContent value="mas-vendidos">
          <ModulePlaceholder
            title="Productos más vendidos"
            description="Este reporte se arma con los datos del módulo de Ventas, todavía pendiente de construir."
            icon={TrendingUp}
          />
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
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicamento</TableHead>
            <TableHead>Código</TableHead>
            <TableHead className="text-right">Stock actual</TableHead>
            <TableHead className="text-right">Stock mínimo</TableHead>
            <TableHead className="text-right">Déficit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(({ medicamento, stock }) => (
            <TableRow key={medicamento.id_medicamento}>
              <TableCell className="max-w-56 truncate font-medium" title={medicamento.nombre}>
                {medicamento.nombre}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">{medicamento.codigo}</TableCell>
              <TableCell className="text-right">{stock}</TableCell>
              <TableCell className="text-right">{medicamento.stock_minimo}</TableCell>
              <TableCell className="text-right">
                <Badge variant="destructive">{medicamento.stock_minimo - stock}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProximosAVencerTable({
  items,
  medicamentoById,
}: {
  items: Lote[];
  medicamentoById: Map<number, Medicamento>;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicamento</TableHead>
            <TableHead>N° Lote</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Días</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((l) => {
            const dias = diasHasta(l.fecha_vencimiento);
            return (
              <TableRow key={l.id_lote}>
                <TableCell
                  className="max-w-56 truncate font-medium"
                  title={medicamentoById.get(l.id_medicamento)?.nombre}
                >
                  {medicamentoById.get(l.id_medicamento)?.nombre ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{l.numero_lote}</TableCell>
                <TableCell className="whitespace-nowrap">{l.fecha_vencimiento}</TableCell>
                <TableCell>
                  <Badge variant={dias < 0 ? "destructive" : "warning"}>
                    {dias < 0 ? `Venció hace ${Math.abs(dias)} d.` : `${dias} d.`}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{l.cantidad_actual}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
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

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>N° Lote</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kardex.map((k) => {
            const meta = TIPO_META[k.tipo];
            const Icon = meta.icon;
            return (
              <TableRow key={k.id_movimiento}>
                <TableCell>
                  <span className={`flex items-center gap-1.5 whitespace-nowrap ${meta.className}`}>
                    <Icon className="size-4" aria-hidden />
                    {meta.label}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{k.numero_lote}</TableCell>
                <TableCell className={`whitespace-nowrap text-right font-medium ${meta.className}`}>
                  {k.cantidad > 0 ? "+" : ""}
                  {k.cantidad}
                </TableCell>
                <TableCell className="text-right">{k.saldo}</TableCell>
                <TableCell className="max-w-48 truncate" title={k.motivo}>
                  {k.motivo}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatFecha(k.fecha)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
