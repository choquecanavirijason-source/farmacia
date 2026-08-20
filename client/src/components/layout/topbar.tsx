"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Pill, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavList } from "@/components/layout/nav-list";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { clearClientSession } from "@/lib/auth/client-session";
import { apiFetch, setAuthToken } from "@/lib/api/http";
import type { MenuGroup } from "@/lib/nav/menu-config";
import type { Sesion } from "@/lib/types";

interface TopbarProps {
  sesion: Sesion;
  groups: MenuGroup[];
}

function initials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({ sesion, groups }: TopbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Token ya inválido o servidor inalcanzable: igual cerramos sesión localmente.
    } finally {
      clearClientSession();
      setAuthToken(null);
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú de navegación"
            />
          }
        >
          <Menu className="size-5" aria-hidden />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border/60">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Pill className="size-4" aria-hidden />
              </span>
              Farmacia Juan de Dios
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-3 py-4">
            <NavList groups={groups} onNavigate={() => setSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={loggingOut}
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="size-4.5" aria-hidden />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {initials(sesion.nombre)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline max-w-40 truncate">
            {sesion.nombre}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-sm font-medium">{sesion.nombre}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {sesion.rol === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sesion.rol === "ADMINISTRADOR" ? (
            <DropdownMenuItem render={<Link href="/configuracion" />}>
              <Settings className="size-4" aria-hidden />
              Configuración de la empresa
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            disabled={loggingOut}
            onSelect={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            <LogOut className="size-4" aria-hidden />
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
