"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  Pill,
  Settings,
  PanelLeft,
  PanelLeftClose,
  ChevronDown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavList } from "@/components/layout/nav-list";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LayoutCustomizer } from "@/components/layout/layout-customizer";
import { EditProfileDialog } from "@/components/layout/edit-profile-dialog";
import { useLayout } from "@/context/layout-context";
import { useAuth } from "@/context/auth-context";
import { ICON_MAP } from "@/lib/nav/menu-icons";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import type { MenuGroup, MenuItem } from "@/lib/nav/menu-config";
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
  const pathname = usePathname();
  const { user } = useAuth();
  const { layoutMode, sidebarPinned, toggleSidebarPinned } = useLayout();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  // Verifica si algún ítem o sub-ítem dentro de un grupo coincide con la ruta actual
  function isGroupActive(group: MenuGroup): boolean {
    function checkItem(item: MenuItem): boolean {
      if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        return true;
      }
      if (item.children) {
        return item.children.some(checkItem);
      }
      return false;
    }
    return group.items.some(checkItem);
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex items-center gap-3 min-w-0">
        {/* Botón de Menú Móvil */}
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
            <SheetHeader className="border-b border-border/60 p-4">
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

        {/* Modo Top Navigation: Logo e Identificador */}
        {layoutMode === "top" && (
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-2.5 mr-2 font-bold text-sm tracking-tight text-foreground hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Pill className="size-4" aria-hidden />
            </span>
            <span>Juan de Dios</span>
          </Link>
        )}

        {/* Modo Sidebar: Único botón para alternar fijar/colapsar sidebar en Desktop */}
        {layoutMode === "sidebar" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSidebarPinned}
            className="hidden md:flex text-muted-foreground hover:text-foreground"
            title={sidebarPinned ? "Colapsar menú lateral" : "Fijar menú lateral"}
            aria-label={sidebarPinned ? "Colapsar menú lateral" : "Fijar menú lateral"}
          >
            {sidebarPinned ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeft className="size-5" />
            )}
          </Button>
        )}

        {/* Navegación Horizontal Compacta en UNA SOLA FILA con soporte hasta 3er nivel */}
        {layoutMode === "top" && (
          <nav className="hidden md:flex items-center gap-1.5 ml-2 overflow-x-auto py-1">
            {groups.map((group) => {
              const groupActive = isGroupActive(group);

              // Si el grupo solo tiene 1 ítem directo (ej. Dashboard)
              if (group.items.length === 1 && !group.items[0].children && group.items[0].href) {
                const singleItem = group.items[0];
                const active = pathname === singleItem.href || pathname.startsWith(`${singleItem.href}/`);
                const Icon = ICON_MAP[singleItem.iconName];

                return (
                  <Link
                    key={singleItem.href || singleItem.label}
                    href={singleItem.href || "#"}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0",
                      active
                        ? "bg-primary/10 font-bold text-primary"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{singleItem.label}</span>
                  </Link>
                );
              }

              // Si el grupo tiene múltiples ítems o subniveles (Desplegable Nivel 1)
              return (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant={groupActive ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-8 gap-1 text-xs font-medium px-2.5 shrink-0",
                          groupActive && "bg-primary/10 text-primary font-bold hover:bg-primary/15"
                        )}
                      />
                    }
                  >
                    <span>{group.label}</span>
                    <ChevronDown className="size-3 opacity-60 ml-0.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1.5">
                    <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      {group.label}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />

                    {group.items.map((item) => {
                      const hasChildren = Boolean(item.children && item.children.length > 0);
                      const Icon = ICON_MAP[item.iconName];

                      // Nivel 2 con submenú (Nivel 3)
                      if (hasChildren && item.children) {
                        const isSubActive = item.children.some(
                          (c) => c.href && (pathname === c.href || pathname.startsWith(`${c.href}/`))
                        );

                        return (
                          <DropdownMenuSub key={item.label}>
                            <DropdownMenuSubTrigger
                              className={cn(
                                "flex items-center gap-2 cursor-pointer py-1.5 text-xs",
                                isSubActive && "text-primary font-bold"
                              )}
                            >
                              <Icon className="size-3.5 shrink-0" />
                              <span>{item.label}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-52 p-1.5">
                              {item.children.map((child) => {
                                const isChildCurrent = Boolean(
                                  child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`))
                                );
                                const ChildIcon = ICON_MAP[child.iconName];

                                return (
                                  <DropdownMenuItem
                                    key={child.href}
                                    onClick={() => child.href && router.push(child.href)}
                                    className={cn(
                                      "flex items-center gap-2 cursor-pointer py-1.5 text-xs",
                                      isChildCurrent && "bg-primary/10 font-bold text-primary"
                                    )}
                                  >
                                    <ChildIcon className="size-3.5 shrink-0" />
                                    <span>{child.label}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      }

                      // Nivel 2 directo
                      const isDirectCurrent = Boolean(
                        item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
                      );

                      return (
                        <DropdownMenuItem
                          key={item.href || item.label}
                          onClick={() => item.href && router.push(item.href)}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer py-1.5 text-xs",
                            isDirectCurrent && "bg-primary/10 font-bold text-primary"
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Preferencias de interfaz (Sidebar / Top) */}
        <LayoutCustomizer />

        {/* Alternador de Tema Claro / Oscuro */}
        <ThemeToggle />

        {/* Menú de Perfil de Usuario */}
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
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
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
            <DropdownMenuItem
              onClick={() => setProfileOpen(true)}
              className="cursor-pointer"
            >
              <User className="size-4" aria-hidden />
              Editar perfil
            </DropdownMenuItem>
            {sesion.rol === "ADMINISTRADOR" ? (
              <DropdownMenuItem
                onClick={() => router.push("/configuracion")}
                className="cursor-pointer"
              >
                <Settings className="size-4" aria-hidden />
                Configuración de la empresa
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              disabled={loggingOut}
              onClick={handleLogout}
              className="cursor-pointer"
            >
              <LogOut className="size-4" aria-hidden />
              {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modal para editar datos de perfil y contraseña */}
        <EditProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          user={user}
        />
      </div>
    </header>
  );
}
