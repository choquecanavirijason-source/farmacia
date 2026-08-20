"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MenuGroup } from "@/lib/nav/menu-config";
import { ICON_MAP } from "@/lib/nav/menu-icons";

interface NavListProps {
  groups: MenuGroup[];
  onNavigate?: () => void;
  /** true dentro del riel colapsable de escritorio: las etiquetas se ocultan y aparecen con el hover del `group/rail` padre (o siempre, si `railExpanded`). */
  rail?: boolean;
  /** true cuando el riel está fijado (pin) — las etiquetas quedan visibles sin depender del hover, para uso táctil/tablet. */
  railExpanded?: boolean;
}

export function NavList({ groups, onNavigate, rail = false, railExpanded = false }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p
            className={cn(
              "px-2 text-xs font-medium text-nowrap uppercase tracking-wide text-muted-foreground/80",
              rail &&
                (railExpanded
                  ? "opacity-100"
                  : "opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100")
            )}
          >
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = ICON_MAP[item.iconName];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={rail && !railExpanded ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-200 ease-in-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
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
          })}
        </div>
      ))}
    </nav>
  );
}
