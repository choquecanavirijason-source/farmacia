"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, PinOff, Pin } from "lucide-react";
import { NavList } from "@/components/layout/nav-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuGroup } from "@/lib/nav/menu-config";

interface SidebarProps {
  groups: MenuGroup[];
}

/**
 * Riel en flujo normal (no overlay): colapsado muestra solo íconos (w-16);
 * al pasar el cursor se expande (w-64) revelando las etiquetas. Al ser un
 * ítem flex normal, el contenido de al lado se acomoda solo durante la
 * transición — nada queda tapado.
 *
 * El hover-only no sirve en tablets táctiles (sin mouse, sin hover) — por
 * eso hay un botón "fijar" que expande el riel de forma permanente sin
 * depender del cursor.
 */
export function Sidebar({ groups }: SidebarProps) {
  const [pinned, setPinned] = useState(false);

  return (
    <aside
      className={cn(
        "group/rail sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex",
        pinned ? "md:w-64" : "md:w-16 md:hover:w-64"
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Pill className="size-4" aria-hidden />
          </span>
          <span
            className={cn(
              "max-w-0 overflow-hidden text-sm font-semibold tracking-tight text-nowrap opacity-0 transition-all duration-300",
              pinned ? "max-w-40 opacity-100" : "group-hover/rail:max-w-40 group-hover/rail:opacity-100"
            )}
          >
            Farmacia Juan de Dios
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <NavList groups={groups} rail railExpanded={pinned} />
      </div>
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPinned((p) => !p)}
          className={cn(
            "w-full gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground",
            pinned ? "justify-start" : "justify-center group-hover/rail:justify-start"
          )}
          aria-label={pinned ? "Colapsar menú" : "Fijar menú expandido"}
          title={pinned ? "Colapsar menú" : "Fijar menú expandido"}
        >
          {pinned ? <PinOff className="size-4 shrink-0" aria-hidden /> : <Pin className="size-4 shrink-0" aria-hidden />}
          <span
            className={cn(
              "max-w-0 overflow-hidden text-xs text-nowrap opacity-0 transition-all duration-300",
              pinned ? "max-w-32 opacity-100" : "group-hover/rail:max-w-32 group-hover/rail:opacity-100"
            )}
          >
            {pinned ? "Colapsar menú" : "Fijar menú"}
          </span>
        </Button>
      </div>
    </aside>
  );
}
