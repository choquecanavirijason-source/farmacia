"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  PackageX,
  Wallet,
  TrendingUp,
  TrendingDown,
  Boxes,
  Users,
  Plus,
  ArrowUpRight,
  ChevronRight,
  CalendarClock,
  Receipt,
  Percent,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardStats, type IDashboardStats } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/format";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { useBranchView } from "@/context/branch-view-context";
import { ChartCard } from "./charts/chart-card";
import { AreaChart } from "./charts/area-chart";
import { DonutChart } from "./charts/donut-chart";
import { BarChart } from "./charts/bar-chart";
import { ComboChart } from "./charts/combo-chart";
import { HeatmapChart } from "./charts/heatmap-chart";
import { SEMAFORO_PALETTE } from "./charts/chart-theme";

function formatFechaCorta(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { branchScope } = useBranchView();
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fullName = user?.firstname && user?.lastname
    ? `${user.firstname} ${user.lastname}`.trim()
    : user?.name ?? "";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchDashboardStats(branchScope ? { branch_id: branchScope } : undefined)
      .then((data) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch(() => {
        // Fallback controlado
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [branchScope]);

  const stockSaludablePct = stats && stats.total_medicamentos
    ? Math.round(((stats.total_medicamentos_stock_saludable ?? 0) / stats.total_medicamentos) * 100)
    : null;

  const variacion = stats?.variacion_mensual_pct ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado con Bienvenida y Acciones Rápidas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Bienvenido, {fullName || "Usuario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Panel de control operativo y métricas en tiempo real.
          </p>
        </div>

        {/* Barra de Acciones Rápidas Compacta */}
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.CREATE_SALES) && (
            <Button nativeButton={false} render={<Link href="/ventas" />} size="sm" className="gap-1.5 shadow-xs">
              <ShoppingBag className="size-4" />
              Nueva Venta
            </Button>
          )}

          {can(PERMISSIONS.VIEW_CASH_REGISTERS) && (
            <Button nativeButton={false} render={<Link href="/caja" />} variant="outline" size="sm" className="gap-1.5">
              <Wallet className="size-4" />
              Caja
            </Button>
          )}

          {can(PERMISSIONS.CREATE_MEDICAMENTS) && (
            <Button nativeButton={false} render={<Link href="/medicamentos" />} variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Medicamento
            </Button>
          )}

          {can(PERMISSIONS.CREATE_CLIENTS) && (
            <Button nativeButton={false} render={<Link href="/clientes" />} variant="outline" size="sm" className="gap-1.5">
              <Users className="size-4" />
              Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Estado Operativo — lo primero que se quiere ver de un vistazo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          icon={Wallet}
          label="Caja de Turno"
          value={stats ? (stats.caja_abierta ? "Abierta" : "Cerrada") : null}
          subtext={
            stats?.caja_abierta
              ? `Monto inicial: ${formatCurrency(stats.caja_abierta.opening_amount)}`
              : "Sin caja abierta en este momento"
          }
          tone={stats?.caja_abierta ? "success" : "muted"}
          href="/caja"
          isLoading={isLoading}
        />
        <KpiCard
          icon={Users}
          label="Clientes Registrados"
          value={stats ? String(stats.total_clientes) : null}
          subtext="Base de clientes activa"
          tone="primary"
          href="/clientes"
          isLoading={isLoading}
        />
      </div>

      {/* ============ SECCIÓN: VENTAS ============ */}
      <SectionHeader
        icon={ShoppingBag}
        title="Ventas"
        description="Facturación, tendencia y desempeño comercial"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ShoppingBag}
          label="Ventas de Hoy"
          value={stats ? formatCurrency(stats.ventas_hoy.total) : null}
          subtext={stats ? `${stats.ventas_hoy.cantidad} transacciones registradas` : undefined}
          tone="primary"
          isLoading={isLoading}
        />
        <KpiCard
          icon={TrendingUp}
          label="Ventas del Mes"
          value={stats ? formatCurrency(stats.ventas_mes.total) : null}
          subtext="Facturación acumulada"
          tone="success"
          isLoading={isLoading}
        />
        <KpiCard
          icon={Receipt}
          label="Ticket Promedio (Hoy)"
          value={stats ? formatCurrency(stats.ticket_promedio_hoy ?? 0) : null}
          subtext="Promedio por venta del día"
          tone="primary"
          isLoading={isLoading}
        />
        <KpiCard
          icon={variacion !== null && variacion < 0 ? TrendingDown : TrendingUp}
          label="Variación Mensual"
          value={stats ? (variacion === null ? "N/A" : `${variacion > 0 ? "+" : ""}${variacion}%`) : null}
          subtext="Vs. mismo periodo del mes anterior"
          tone={variacion === null ? "muted" : variacion >= 0 ? "success" : "warning"}
          isLoading={isLoading}
        />
      </div>

      {/* Paneles Informativos: Ventas Recientes y Medicamentos Más Vendidos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Ventas Recientes</CardTitle>
              <CardDescription className="text-xs">Últimas transacciones realizadas en el sistema</CardDescription>
            </div>
            <Link
              href="/ventas"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : !stats?.ultimas_ventas?.length ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Aún no hay ventas registradas en la jornada.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {stats.ultimas_ventas.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary font-mono text-[11px] font-bold">
                        #{v.id}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{v.cliente}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatFechaCorta(v.fecha_hora)}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-foreground">
                      {formatCurrency(v.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Más Vendidos</CardTitle>
            <CardDescription className="text-xs">Medicamentos de mayor rotación</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : !stats?.top_productos?.length ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Sin datos de rotación acumulados.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {stats.top_productos.map((prod, idx) => (
                  <div key={prod.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold text-muted-foreground w-4 text-center">
                        {idx + 1}.
                      </span>
                      <span className="truncate font-medium">{prod.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[11px] shrink-0 font-semibold">
                      {prod.total_vendido} uds.
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Tendencia de Ventas"
          description="Ingresos por ventas activas en el periodo"
          className="lg:col-span-2"
          isLoading={isLoading}
          isEmpty={!stats?.ventas_por_rango?.length}
        >
          {(height) => (
            <AreaChart
              categories={stats?.ventas_por_rango?.map((d) => d.label) ?? []}
              series={[{ name: "Ventas", data: stats?.ventas_por_rango?.map((d) => d.value) ?? [] }]}
              formatValue={formatCurrency}
              height={height}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Ventas por Método de Pago"
          description="Distribución de ingresos por forma de cobro"
          isLoading={isLoading}
          isEmpty={!stats?.ventas_por_metodo_pago?.length}
        >
          {(height) => (
            <DonutChart
              labels={stats?.ventas_por_metodo_pago?.map((d) => d.name) ?? []}
              series={stats?.ventas_por_metodo_pago?.map((d) => d.total) ?? []}
              formatValue={formatCurrency}
              height={height}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Ventas por Categoría"
          description="Qué categorías generan más ingresos"
          isLoading={isLoading}
          isEmpty={!stats?.ventas_por_categoria?.length}
        >
          {(height) => (
            <DonutChart
              labels={stats?.ventas_por_categoria?.map((d) => d.name) ?? []}
              series={stats?.ventas_por_categoria?.map((d) => d.total) ?? []}
              formatValue={formatCurrency}
              height={height}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Ranking de Vendedores"
          description="Total vendido por cajero/vendedor en el periodo"
          isLoading={isLoading}
          isEmpty={!stats?.ranking_vendedores?.length}
        >
          {(height) => (
            <BarChart
              categories={stats?.ranking_vendedores?.map((d) => d.name) ?? []}
              series={stats?.ranking_vendedores?.map((d) => d.total_vendido) ?? []}
              formatValue={formatCurrency}
              color="#6366f1"
              height={height}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Ventas por Día de la Semana"
          description="Últimos 30 días"
          isLoading={isLoading}
          isEmpty={!stats?.ventas_por_dia_semana?.some((d) => d.value > 0)}
        >
          {(height) => (
            <BarChart
              categories={stats?.ventas_por_dia_semana?.map((d) => d.label.slice(0, 3)) ?? []}
              series={stats?.ventas_por_dia_semana?.map((d) => d.value) ?? []}
              formatValue={formatCurrency}
              horizontal={false}
              color="#f59e0b"
              height={height}
            />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Horas Pico de Venta"
        description="Ingresos por hora del día × día de la semana — últimos 30 días"
        isLoading={isLoading}
        isEmpty={!stats?.ventas_por_hora_dia?.length}
        height={340}
      >
        {(height) => (
          <HeatmapChart data={stats?.ventas_por_hora_dia ?? []} formatValue={formatCurrency} height={height} />
        )}
      </ChartCard>

      {/* ============ SECCIÓN: INVENTARIO ============ */}
      <SectionHeader
        icon={Boxes}
        title="Inventario"
        description="Catálogo, niveles de stock y vencimientos"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Boxes}
          label="Medicamentos Registrados"
          value={stats ? String(stats.total_medicamentos) : null}
          subtext="Catálogo activo"
          tone="primary"
          href="/medicamentos"
          isLoading={isLoading}
        />
        <KpiCard
          icon={PackageX}
          label="Stock Bajo"
          value={stats ? String(stats.stock_bajo_count) : null}
          subtext={stats && stats.stock_bajo_count > 0 ? "Requiere reposición urgente" : "Niveles de stock óptimos"}
          tone={stats && stats.stock_bajo_count > 0 ? "warning" : "muted"}
          href="/medicamentos"
          isLoading={isLoading}
        />
        <KpiCard
          icon={CalendarClock}
          label="Lotes por Vencer (<90d)"
          value={stats ? String(stats.lotes_por_vencer_count) : null}
          subtext="Requieren rotación prioritaria"
          tone={stats && stats.lotes_por_vencer_count > 0 ? "warning" : "muted"}
          href="/lotes"
          isLoading={isLoading}
        />
        <KpiCard
          icon={Percent}
          label="Stock Saludable"
          value={stockSaludablePct === null ? null : `${stockSaludablePct}%`}
          subtext="Medicamentos sobre su mínimo"
          tone={stockSaludablePct !== null && stockSaludablePct < 70 ? "warning" : "success"}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Semáforo de Vencimiento"
          description="Lotes con stock, por proximidad a vencer"
          isLoading={isLoading}
          isEmpty={!stats?.lotes_semaforo?.some((d) => d.value > 0)}
        >
          {(height) => (
            <DonutChart
              labels={stats?.lotes_semaforo?.map((d) => d.label) ?? []}
              series={stats?.lotes_semaforo?.map((d) => d.value) ?? []}
              colors={SEMAFORO_PALETTE}
              formatValue={(v) => `${v} lote${v === 1 ? "" : "s"}`}
              height={height}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Productos de Baja Rotación"
          description="Con stock disponible, pero poco vendidos (últimos 90 días)"
          isLoading={isLoading}
          isEmpty={!stats?.productos_baja_rotacion?.length}
        >
          {(height) => (
            <BarChart
              categories={stats?.productos_baja_rotacion?.map((d) => d.name) ?? []}
              series={stats?.productos_baja_rotacion?.map((d) => d.vendido_90_dias) ?? []}
              formatValue={(v) => `${v} uds.`}
              color="#f43f5e"
              height={height}
            />
          )}
        </ChartCard>
      </div>

      {/* ============ SECCIÓN: COMPRAS Y RENTABILIDAD ============ */}
      <SectionHeader
        icon={ShoppingCart}
        title="Compras y Rentabilidad"
        description="Abastecimiento, proveedores y margen bruto"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Compras vs. Ventas"
          description="Comparativa mensual — últimos 6 meses"
          className="lg:col-span-2"
          isLoading={isLoading}
          isEmpty={!stats?.compras_vs_ventas?.length}
        >
          {(height) => (
            <ComboChart
              categories={stats?.compras_vs_ventas?.map((d) => d.label) ?? []}
              series={[
                { name: "Ventas", data: stats?.compras_vs_ventas?.map((d) => d.ventas) ?? [] },
                { name: "Compras", data: stats?.compras_vs_ventas?.map((d) => d.compras) ?? [] },
              ]}
              formatValue={formatCurrency}
              height={height}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Compras por Proveedor"
          description="Participación de cada proveedor — últimos 90 días"
          isLoading={isLoading}
          isEmpty={!stats?.compras_por_proveedor?.length}
        >
          {(height) => (
            <DonutChart
              labels={stats?.compras_por_proveedor?.map((d) => d.name) ?? []}
              series={stats?.compras_por_proveedor?.map((d) => d.total) ?? []}
              formatValue={formatCurrency}
              height={height}
            />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Margen Bruto"
        description="Ingreso vs. costo de lo vendido en el periodo"
        isLoading={isLoading}
        isEmpty={!stats?.margen_por_rango?.length}
      >
        {(height) => (
          <AreaChart
            categories={stats?.margen_por_rango?.map((d) => d.label) ?? []}
            series={[
              { name: "Ingreso", data: stats?.margen_por_rango?.map((d) => d.ingreso) ?? [], color: "#2dd4bf" },
              { name: "Costo", data: stats?.margen_por_rango?.map((d) => d.costo) ?? [], color: "#f43f5e" },
            ]}
            formatValue={formatCurrency}
            height={height}
          />
        )}
      </ChartCard>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex flex-col">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

const TONE_CLASSES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  muted: "bg-muted text-muted-foreground",
} as const;

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone,
  href,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string | null;
  subtext?: string;
  tone: keyof typeof TONE_CLASSES;
  href?: string;
  isLoading?: boolean;
}) {
  const content = (
    <Card className="border-border/60 h-full transition-all hover:border-primary/40">
      <CardContent className="flex items-center gap-3.5 p-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {isLoading || value === null ? (
            <Skeleton className="h-6 w-24 my-0.5" />
          ) : (
            <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
          )}
          {subtext && (
            <p className="text-[11px] text-muted-foreground/80 truncate">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
