"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuGroup, MenuItem } from "@/lib/nav/menu-config";
import { ICON_MAP } from "@/lib/nav/menu-icons";

interface NavListProps {
  groups: MenuGroup[];
  onNavigate?: () => void;
  rail?: boolean;
  railExpanded?: boolean;
}

/** Quita el query string de un href de menú (ej. "/categorias?tab=x" -> "/categorias") para comparar contra `pathname`. */
function stripQuery(href: string): string {
  return href.split("?")[0];
}

function pathMatches(href: string, pathname: string): boolean {
  const path = stripQuery(href);
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Compara el query de un href de menú contra el query real de la URL (ej. "?tab=laboratorios"). */
function queryMatches(href: string, searchParams: URLSearchParams | null): boolean {
  const query = href.split("?")[1];
  if (!query) {
    // Sin query en el href (ej. la pestaña por defecto "/categorias"): solo coincide si la URL actual tampoco trae "tab".
    return !searchParams || !searchParams.get("tab");
  }
  if (!searchParams) return false; // aún no se resolvió el query real (primer render antes de hidratar)
  const params = new URLSearchParams(query);
  for (const [key, value] of params) {
    if (searchParams.get(key) !== value) return false;
  }
  return true;
}

function isFullyActive(href: string, pathname: string, searchParams: URLSearchParams | null): boolean {
  return pathMatches(href, pathname) && queryMatches(href, searchParams);
}

/** ¿La ruta actual cae dentro de este ítem o de alguno de sus descendientes? (recursivo, para abrir/resaltar acordeones anidados). */
function containsActivePath(item: MenuItem, pathname: string): boolean {
  if (item.href && pathMatches(item.href, pathname)) return true;
  return Boolean(item.children?.some((c) => containsActivePath(c, pathname)));
}

export function NavList(props: NavListProps) {
  return (
    <Suspense fallback={<NavListBody {...props} searchParams={null} />}>
      <NavListWithSearchParams {...props} />
    </Suspense>
  );
}

function NavListWithSearchParams(props: NavListProps) {
  const searchParams = useSearchParams();
  return <NavListBody {...props} searchParams={searchParams} />;
}

function NavListBody({
  groups,
  onNavigate,
  rail = false,
  railExpanded = false,
  searchParams,
}: NavListProps & { searchParams: URLSearchParams | null }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col", rail && !railExpanded ? "gap-2" : "gap-5")}>
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p
            className={cn(
              "overflow-hidden px-2.5 text-[11px] font-bold uppercase tracking-wider text-nowrap text-muted-foreground/70 transition-all duration-200",
              rail
                ? railExpanded
                  ? "h-5.5 py-1 opacity-100"
                  : "h-0 py-0 opacity-0 group-hover/rail:h-5.5 group-hover/rail:py-1 group-hover/rail:opacity-100"
                : "h-5.5 py-1 opacity-100"
            )}
          >
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavSubItem
                key={item.href || item.label}
                item={item}
                depth={0}
                onNavigate={onNavigate}
                rail={rail}
                railExpanded={railExpanded}
                pathname={pathname}
                searchParams={searchParams}
                isActive={
                  item.href
                    ? isFullyActive(item.href, pathname, searchParams)
                    : containsActivePath(item, pathname)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function NavSubItem({
  item,
  depth,
  onNavigate,
  rail,
  railExpanded,
  pathname,
  searchParams,
  isActive,
}: {
  item: MenuItem;
  depth: number;
  onNavigate?: () => void;
  rail?: boolean;
  railExpanded?: boolean;
  pathname: string;
  searchParams: URLSearchParams | null;
  isActive: boolean;
}) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const [isOpen, setIsOpen] = useState<boolean>(isActive);
  const Icon = ICON_MAP[item.iconName] || Circle;

  if (hasChildren && item.children) {
    // Entre hermanos-hoja que comparten la misma ruta con distinto query (ej. las pestañas de
    // "Categorías y Catálogos"), o cuyo href es prefijo unos de otros (ej. "/ventas" y "/ventas/historial"),
    // solo el más específico queda resaltado — evita que varios se marquen activos a la vez.
    const activeLeafHref = item.children
      .filter((c) => c.href && isFullyActive(c.href, pathname, searchParams))
      .sort((a, b) => stripQuery(b.href!).length - stripQuery(a.href!).length)[0]?.href;

    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors duration-150 select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isActive
              ? "text-primary font-semibold"
              : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="size-4 shrink-0" aria-hidden />
            <span
              className={cn(
                "truncate text-left",
                rail &&
                  (railExpanded
                    ? "max-w-36 opacity-100"
                    : "max-w-0 opacity-0 transition-all duration-300 group-hover/rail:max-w-36 group-hover/rail:opacity-100")
              )}
            >
              {item.label}
            </span>
          </div>

          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen ? "rotate-0" : "-rotate-90",
              rail &&
                (railExpanded
                  ? "opacity-100"
                  : "opacity-0 transition-opacity duration-300 group-hover/rail:opacity-100")
            )}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              "ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5 py-1",
              rail &&
                (railExpanded
                  ? "block"
                  : "hidden group-hover/rail:block")
            )}
          >
            {item.children.map((child) => {
              const childIsActive = child.href
                ? child.href === activeLeafHref
                : containsActivePath(child, pathname);

              return (
                <NavSubItem
                  key={child.href || child.label}
                  item={child}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                  rail={rail}
                  railExpanded={railExpanded}
                  pathname={pathname}
                  searchParams={searchParams}
                  isActive={childIsActive}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Ítem hoja (sin hijos)
  return (
    <Link
      href={item.href || "#"}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        depth > 0 ? "font-normal" : "font-medium",
        isActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className={cn("shrink-0", depth > 0 ? "size-3.5 opacity-80" : "size-4")} aria-hidden />
      <span
        className={cn(
          "truncate",
          rail &&
            (railExpanded
              ? "max-w-40 opacity-100"
              : "max-w-0 opacity-0 transition-all duration-300 group-hover/rail:max-w-40 group-hover/rail:opacity-100")
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
