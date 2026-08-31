"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function NavList({
  groups,
  onNavigate,
  rail = false,
  railExpanded = false,
}: NavListProps) {
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p
            className={cn(
              "px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70",
              rail &&
                (railExpanded
                  ? "opacity-100"
                  : "opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100")
            )}
          >
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavSubItem
                key={item.href || item.label}
                item={item}
                onNavigate={onNavigate}
                rail={rail}
                railExpanded={railExpanded}
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
  onNavigate,
  rail,
  railExpanded,
}: {
  item: MenuItem;
  onNavigate?: () => void;
  rail?: boolean;
  railExpanded?: boolean;
}) {
  const pathname = usePathname();
  const hasChildren = Boolean(item.children && item.children.length > 0);

  // Determinar si algún hijo está activo para abrir el acordeón por defecto
  const isChildActive = Boolean(
    item.children?.some(
      (c) => c.href && (pathname === c.href || pathname.startsWith(`${c.href}/`))
    )
  );

  const isDirectActive = Boolean(
    item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  const [isOpen, setIsOpen] = useState<boolean>(isChildActive);
  const Icon = ICON_MAP[item.iconName] || Circle;

  // Si tiene subniveles (hijos)
  if (hasChildren && item.children) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors duration-150 select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isChildActive
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
              const active = Boolean(
                child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`))
              );
              const ChildIcon = ICON_MAP[child.iconName] || Circle;

              return (
                <Link
                  key={child.href}
                  href={child.href || "#"}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <ChildIcon className="size-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Ítem directo (sin hijos)
  return (
    <Link
      href={item.href || "#"}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDirectActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      aria-current={isDirectActive ? "page" : undefined}
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
}
