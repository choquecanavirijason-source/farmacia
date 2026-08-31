"use client";

import {
  PanelLeft,
  LayoutTemplate,
  Pin,
  PinOff,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLayout } from "@/context/layout-context";
import { cn } from "@/lib/utils";

export function LayoutCustomizer() {
  const {
    layoutMode,
    setLayoutMode,
    sidebarPinned,
    toggleSidebarPinned,
  } = useLayout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Personalizar navegación y diseño"
            title="Personalizar diseño de navegación"
          />
        }
      >
        <SlidersHorizontal className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Posición del Menú
        </DropdownMenuLabel>
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem
            onClick={() => setLayoutMode("sidebar")}
            className={cn(
              "flex items-center justify-between cursor-pointer py-2",
              layoutMode === "sidebar" && "bg-primary/10 font-semibold text-primary"
            )}
          >
            <div className="flex items-center gap-2.5">
              <PanelLeft className="size-4" />
              <span>Barra lateral (Sidebar)</span>
            </div>
            {layoutMode === "sidebar" && <Check className="size-4" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setLayoutMode("top")}
            className={cn(
              "flex items-center justify-between cursor-pointer py-2",
              layoutMode === "top" && "bg-primary/10 font-semibold text-primary"
            )}
          >
            <div className="flex items-center gap-2.5">
              <LayoutTemplate className="size-4" />
              <span>Barra superior (Top)</span>
            </div>
            {layoutMode === "top" && <Check className="size-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {layoutMode === "sidebar" && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Comportamiento del Sidebar
            </DropdownMenuLabel>
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem
                onClick={toggleSidebarPinned}
                className="flex items-center justify-between cursor-pointer py-2"
              >
                <div className="flex items-center gap-2.5">
                  {sidebarPinned ? (
                    <Pin className="size-4 text-primary" />
                  ) : (
                    <PinOff className="size-4 text-muted-foreground" />
                  )}
                  <span>{sidebarPinned ? "Sidebar Fijo (Expandido)" : "Sidebar Colapsable"}</span>
                </div>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {sidebarPinned ? "Fijo" : "Auto"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
