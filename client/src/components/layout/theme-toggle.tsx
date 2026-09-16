"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Alterna claro/oscuro. `resolvedTheme` es `undefined` en el servidor y en el
 * primer render del cliente (recien se resuelve tras montar, leyendo
 * localStorage/preferencia del sistema). Si el icono dependiera de eso desde
 * el primer render, servidor y cliente dibujarian iconos distintos (Sun vs
 * Moon son elementos distintos, no un simple cambio de texto/atributo, asi
 * que `suppressHydrationWarning` no alcanza para taparlo). Por eso se
 * muestra un icono fijo hasta despues de montar, y recien ahi se usa el
 * tema real.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar tema claro/oscuro"
      title="Cambiar tema"
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </Button>
  );
}
