"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { LayoutProvider, useLayout } from "@/context/layout-context";
import { filterMenuByPermissions, canAccessPath } from "@/lib/nav/menu-config";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Sesion } from "@/lib/types";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, rol, isLoading, isAuthenticated, can } = useAuth();
  const { layoutMode, focusMode, setFocusMode } = useLayout();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Salir de modo enfocado automáticamente al cambiar de página — evita quedar
  // "atrapado" sin sidebar/topbar (ni pantalla completa del navegador) al
  // navegar fuera del POS.
  useEffect(() => {
    setFocusMode(false);
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [pathname, setFocusMode]);

  if (isLoading) {
    return <AppShellSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccess = canAccessPath(pathname, can);
  const groups = filterMenuByPermissions(can);

  const fullName = user.firstname && user.lastname
    ? `${user.firstname} ${user.lastname}`.trim()
    : user.name;

  const sesion: Sesion = {
    id_usuario: user.id,
    nombre: fullName || user.name,
    usuario: user.username || user.email,
    rol: (rol === "administrator" ? "ADMINISTRADOR" : rol === "seller" ? "VENDEDOR" : rol) as "ADMINISTRADOR" | "VENDEDOR",
    token: "",
  };

  return (
    <div
      className={cn(
        "flex min-h-screen w-full bg-muted/20",
        layoutMode === "top" ? "flex-col" : "flex-row"
      )}
    >
      {!focusMode && <Sidebar groups={groups} />}
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        {!focusMode && <Topbar sesion={sesion} groups={groups} />}
        <main
          className={cn(
            "flex-1 min-w-0",
            focusMode ? "p-0" : "px-4 py-6 sm:px-6 lg:px-8",
            layoutMode === "top" && !focusMode && "max-w-7xl mx-auto w-full"
          )}
        >
          {hasAccess ? (
            children
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
              <div className="rounded-full bg-destructive/10 p-4 mb-4 text-destructive">
                <ShieldAlert className="size-10" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Acceso No Autorizado</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6 text-balance">
                No cuentas con los permisos necesarios para acceder a esta sección. Si consideras que es un error, solicita acceso a un administrador.
              </p>
              <Button nativeButton={false} render={<Link href="/dashboard" />} variant="outline" className="gap-2">
                <ArrowLeft className="size-4" />
                Volver al Inicio
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </LayoutProvider>
  );
}

function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <div className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3 md:flex">
        <Skeleton className="size-9 rounded-lg" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-9 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/95 px-4">
          <Skeleton className="size-8 rounded-full md:hidden" />
          <div className="flex-1" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-7 w-48" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
