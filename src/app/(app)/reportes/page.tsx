"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarClock,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  computeProximosAVencer,
  computeStockBajo,
  diasHasta,
  fetchKardexByMedicamento,
  fetchLotes,
  type KardexMovimientoConLote,
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
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Stock actual</TableHead>
                    <TableHead>Stock mínimo</TableHead>
                    <TableHead>Déficit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockBajo.map(({ medicamento, stock }) => (
                    <TableRow key={medicamento.id_medicamento}>
                      <TableCell className="max-w-56 truncate font-medium" title={medicamento.nombre}>
                        {medicamento.nombre}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">{medicamento.codigo}</TableCell>
                      <TableCell>{stock}</TableCell>
                      <TableCell>{medicamento.stock_minimo}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{medicamento.stock_minimo - stock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="por-vencer" className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
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
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>N° Lote</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proximosAVencer.map((l) => {
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
                        <TableCell>{l.cantidad_actual}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kardex" className="flex flex-col gap-4">
          <div className="flex min-w-0 max-w-sm flex-col gap-2">
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

          {!idMedicamentoKardex ? (
            <p className="text-sm text-muted-foreground">Selecciona un medicamento para ver su kardex.</p>
          ) : (
            <KardexTabla key={idMedicamentoKardex} idMedicamento={Number(idMedicamentoKardex)} />
          )}
        </TabsContent>
      </Tabs>
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
            <TableHead>Cantidad</TableHead>
            <TableHead>Saldo</TableHead>
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
                <TableCell className={`whitespace-nowrap font-medium ${meta.className}`}>
                  {k.cantidad > 0 ? "+" : ""}
                  {k.cantidad}
                </TableCell>
                <TableCell>{k.saldo}</TableCell>
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
