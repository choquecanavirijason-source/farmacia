"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getClientSession } from "@/lib/auth/client-session";
import { setAuthToken } from "@/lib/api/http";
import { MENU_GROUPS, rolesAllowedForPath } from "@/lib/nav/menu-config";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sesion } from "@/lib/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);

  useEffect(() => {
    const current = getClientSession();
    if (!current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const allowedRoles = rolesAllowedForPath(pathname);
    if (allowedRoles && !allowedRoles.includes(current.rol)) {
      router.replace("/dashboard");
      return;
    }
    setAuthToken(current.token);
    setSesion(current);
  }, [router, pathname]);

  if (sesion === undefined) {
    return <AppShellSkeleton />;
  }

  if (!sesion) {
    return null;
  }

  const groups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(sesion.rol)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <Sidebar groups={groups} />
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <Topbar sesion={sesion} groups={groups} />
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/**
 * Silueta del layout final (riel + topbar + bloques de contenido) en vez de
 * un spinner/box centrado — evita el salto de layout mientras se resuelve la
 * sesión guardada en el navegador (inevitable en cada recarga completa, ya
 * que el guard de auth corre en el cliente).
 */
function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <div className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3 md:flex">
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
