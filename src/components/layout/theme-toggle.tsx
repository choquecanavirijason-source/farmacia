"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Alterna claro/oscuro. `resolvedTheme` es `undefined` en el primer render
 * del servidor y se resuelve solo tras montar (lo maneja next-themes
 * internamente) — `suppressHydrationWarning` evita el warning de React por
 * ese único frame en que el ícono cambia, sin necesitar un estado "mounted"
 * propio ni un efecto.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <span suppressHydrationWarning>
        {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      </span>
    </Button>
  );
}
