"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  PackageX,
  Wallet,
  TrendingUp,
  Boxes,
  Users,
  Plus,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardStats, type IDashboardStats } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/format";
import { PERMISSIONS } from "@/lib/constants/permissions";

function formatFechaCorta(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fullName = user?.firstname && user?.lastname
    ? `${user.firstname} ${user.lastname}`.trim()
    : user?.name ?? "";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchDashboardStats()
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
  }, []);

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

      {/* Métricas y KPIs Principales */}
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
          icon={PackageX}
          label="Stock Bajo"
          value={stats ? String(stats.stock_bajo_count) : null}
          subtext={stats && stats.stock_bajo_count > 0 ? "Requiere reposición urgente" : "Niveles de stock óptimos"}
          tone={stats && stats.stock_bajo_count > 0 ? "warning" : "muted"}
          href="/medicamentos"
          isLoading={isLoading}
        />
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
      </div>

      {/* Paneles Informativos: Ventas Recientes y Medicamentos Más Vendidos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Últimas Ventas Procesadas */}
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

        {/* Medicamentos Más Vendidos */}
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

      {/* Resumen Operativo de Catálogo y Alertas Preventivas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Boxes className="size-4.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Medicamentos Registrados</span>
                <span className="text-base font-bold">
                  {isLoading || !stats ? <Skeleton className="h-5 w-12 my-0.5" /> : stats.total_medicamentos}
                </span>
              </div>
            </div>
            <Button nativeButton={false} render={<Link href="/medicamentos" />} variant="ghost" size="icon" className="size-8">
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Users className="size-4.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Clientes Registrados</span>
                <span className="text-base font-bold">
                  {isLoading || !stats ? <Skeleton className="h-5 w-12 my-0.5" /> : stats.total_clientes}
                </span>
              </div>
            </div>
            <Button nativeButton={false} render={<Link href="/clientes" />} variant="ghost" size="icon" className="size-8">
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <CalendarClock className="size-4.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Lotes por Vencer (&lt;90d)</span>
                <span className="text-base font-bold">
                  {isLoading || !stats ? <Skeleton className="h-5 w-12 my-0.5" /> : stats.lotes_por_vencer_count}
                </span>
              </div>
            </div>
            <Button nativeButton={false} render={<Link href="/lotes" />} variant="ghost" size="icon" className="size-8">
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
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
