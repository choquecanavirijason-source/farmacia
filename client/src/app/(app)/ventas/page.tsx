"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Wallet, Clock, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PosPanel } from "./pos-panel";
import { fetchCajaAbierta } from "@/lib/api/cash-registers";
import { useAuth } from "@/context/auth-context";
import { useLayout } from "@/context/layout-context";
import { cn } from "@/lib/utils";
import type { Caja, Venta } from "@/lib/types";

export default function VentasPage() {
  const { user } = useAuth();
  const { focusMode, setFocusMode } = useLayout();
  const [caja, setCaja] = useState<Caja | null | undefined>(undefined);

  useEffect(() => {
    fetchCajaAbierta()
      .then((abierta) => {
        setCaja(abierta);
      })
      .catch(() => {
        setCaja(null);
      });
  }, []);

  function handleVentaRegistrada(_venta: Venta) {
    // Venta procesada con éxito
  }

  // Mantiene focusMode sincronizado si el usuario sale de pantalla completa
  // con Esc (el navegador no nos avisa de otra forma).
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setFocusMode(false);
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setFocusMode]);

  async function toggleFocusMode() {
    const next = !focusMode;
    try {
      if (next) {
        await document.documentElement.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // El navegador puede rechazar la solicitud (ej. sin gesto de usuario);
      // igual aplicamos el modo enfocado dentro de la app.
    }
    setFocusMode(next);
  }

  const isLoading = caja === undefined || !user;

  return (
    <div className={cn("flex flex-col gap-6", focusMode && "h-screen gap-4 p-4 sm:p-6")}>
      <div className="flex items-start justify-between gap-3">
        {!focusMode && (
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">Punto de Venta</h1>
            <p className="text-sm text-muted-foreground">Registra ventas rápidas contra la caja abierta.</p>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-1.5", focusMode && "ml-auto")}
          onClick={toggleFocusMode}
          title={focusMode ? "Salir de pantalla completa" : "Ver en pantalla completa"}
        >
          {focusMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          {focusMode ? "Salir de pantalla completa" : "Pantalla completa"}
        </Button>
      </div>

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
        <div className={cn("flex flex-col gap-3 min-h-0", focusMode && "flex-1")}>
          {!focusMode && (
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
                Ver arqueo de caja
              </Link>
            </div>
          )}
          <PosPanel idUsuario={user!.id} idCaja={caja.id_caja} onVentaRegistrada={handleVentaRegistrada} />
        </div>
      )}
    </div>
  );
}
