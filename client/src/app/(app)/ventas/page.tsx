"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Wallet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PosPanel } from "./pos-panel";
import { SalesHistory } from "./sales-history";
import { fetchClientes } from "@/lib/api/clients";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { fetchCajas } from "@/lib/api/cash-registers";
import { fetchVentas } from "@/lib/api/sales";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { Caja, Cliente, Medicamento, Venta } from "@/lib/types";

export default function VentasPage() {
  const { user, can } = useAuth();
  const [caja, setCaja] = useState<Caja | null | undefined>(undefined);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  useEffect(() => {
    Promise.all([fetchCajas(), fetchVentas(), fetchClientes(), fetchMedicamentos()]).then(
      ([cajasData, ventasData, clientesData, medicamentosData]) => {
        const abierta = (cajasData as any[]).find((c) => c.status === "open" || c.estado === "abierta") || null;
        setCaja(abierta);
        setVentas(ventasData);
        setClientes(clientesData);
        setMedicamentos(medicamentosData);
      }
    );
  }, []);

  function handleVentaRegistrada(venta: Venta) {
    setVentas((prev) => [...prev, venta]);
  }

  const isLoading = caja === undefined || !user;
  const canSell = can(PERMISSIONS.CREATE_SALES);
  const canViewHistory = can(PERMISSIONS.VIEW_SALES);
  const defaultTab = canSell ? "vender" : "historial";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Registro de Ventas</h1>
        <p className="text-sm text-muted-foreground">Punto de venta y facturación.</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {canSell && <TabsTrigger value="vender">Punto de Venta (POS)</TabsTrigger>}
          {canViewHistory && <TabsTrigger value="historial">Historial de Ventas</TabsTrigger>}
        </TabsList>

        {canSell && (
          <TabsContent value="vender">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : !caja ? (
              <Card className="border-dashed border-border/60 bg-background/60">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Lock className="size-6" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">La caja está cerrada</p>
                    <p className="max-w-sm text-xs text-balance text-muted-foreground">
                      Necesitas abrir la caja antes de registrar ventas.
                    </p>
                  </div>
                  <Button nativeButton={false} render={<Link href="/caja" />} className="mt-2 gap-1.5">
                    <Wallet className="size-4" aria-hidden />
                    Ir a Caja
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-success">
                    <Clock className="size-4" aria-hidden />
                    Turno abierto desde{" "}
                    {new Date(caja.fecha_apertura).toLocaleTimeString("es-BO", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <Link href="/caja" className="text-muted-foreground underline-offset-2 hover:underline">
                    Cerrar turno
                  </Link>
                </div>
                <PosPanel idUsuario={user!.id} idCaja={caja.id_caja} onVentaRegistrada={handleVentaRegistrada} />
              </div>
            )}
          </TabsContent>
        )}

        {canViewHistory && (
          <TabsContent value="historial">
            <SalesHistory />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
