"use client";

import Link from "next/link";
import { Pill } from "lucide-react";
import { NavList } from "@/components/layout/nav-list";
import { useLayout } from "@/context/layout-context";
import { cn } from "@/lib/utils";
import type { MenuGroup } from "@/lib/nav/menu-config";

interface SidebarProps {
  groups: MenuGroup[];
}

export function Sidebar({ groups }: SidebarProps) {
  const { layoutMode, sidebarPinned } = useLayout();

  // Si el usuario configuró el menú en la parte superior, ocultar la barra lateral en escritorio
  if (layoutMode === "top") {
    return null;
  }

  return (
    <aside
      className={cn(
        "group/rail sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex",
        sidebarPinned ? "md:w-64" : "md:w-16 md:hover:w-64"
      )}
    >
      {/* Cabecera del Sidebar con Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Pill className="size-4" aria-hidden />
          </span>
          <span
            className={cn(
              "max-w-0 overflow-hidden text-sm font-bold tracking-tight text-nowrap opacity-0 transition-all duration-300",
              sidebarPinned ? "max-w-40 opacity-100" : "group-hover/rail:max-w-40 group-hover/rail:opacity-100"
            )}
          >
            Juan de Dios
          </span>
        </Link>
      </div>

      {/* Lista de navegación */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <NavList groups={groups} rail railExpanded={sidebarPinned} />
      </div>
    </aside>
  );
}
