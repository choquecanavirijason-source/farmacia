"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, PackageX, ShoppingBag, Wallet } from "lucide-react";
import { getClientSession } from "@/lib/auth/client-session";
import { menuItemsForRole, type MenuItem } from "@/lib/nav/menu-config";
import { ICON_MAP } from "@/lib/nav/menu-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCajaAbierta } from "@/lib/api/caja";
import { computeStockBajo, fetchLotes } from "@/lib/api/lotes";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import { fetchVentas } from "@/lib/api/ventas";
import type { Caja } from "@/lib/types";

interface Kpis {
  ventasHoy: number;
  stockBajo: number;
  cajaAbierta: Caja | null;
}

function formatBs(valor: number): string {
  return `Bs. ${valor.toFixed(2)}`;
}

export default function DashboardPage() {
  const [nombre, setNombre] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    const sesion = getClientSession();
    if (!sesion) return;
    setNombre(sesion.nombre);
    setItems(menuItemsForRole(sesion.rol));

    Promise.all([fetchVentas(), fetchMedicamentos(), fetchLotes(), fetchCajaAbierta()]).then(
      ([ventas, medicamentos, lotes, cajaAbierta]) => {
        const hoy = new Date().toISOString().slice(0, 10);
        const ventasHoy = ventas
          .filter((v) => v.estado === "activa" && v.fecha.slice(0, 10) === hoy)
          .reduce((total, v) => total + v.total, 0);

        setKpis({
          ventasHoy,
          stockBajo: computeStockBajo(medicamentos, lotes).length,
          cajaAbierta,
        });
      }
    );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Bienvenido, {nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          Menú principal — accede a los módulos disponibles para tu rol.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={ShoppingBag}
          label="Ventas de hoy"
          value={kpis ? formatBs(kpis.ventasHoy) : null}
          tone="primary"
        />
        <KpiCard
          icon={PackageX}
          label="Medicamentos con stock bajo"
          value={kpis ? String(kpis.stockBajo) : null}
          tone={kpis && kpis.stockBajo > 0 ? "warning" : "success"}
        />
        <KpiCard
          icon={Wallet}
          label="Caja"
          value={kpis ? (kpis.cajaAbierta ? "Abierta" : "Cerrada") : null}
          tone={kpis?.cajaAbierta ? "success" : "muted"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          return (
            <Link key={item.href} href={item.href} className="group focus-visible:outline-none">
              <Card className="h-full border-border/60 transition-colors duration-300 ease-in-out group-hover:border-primary/40 group-hover:bg-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <CardTitle className="text-sm font-medium leading-snug text-balance">
                      {item.label}
                    </CardTitle>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Ir al módulo</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
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
  tone,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string | null;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4 py-5">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <p className="text-xl font-semibold tracking-tight text-balance">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
