import type { ReactNode } from "react";
import type { RolNombre } from "@/lib/types";

interface RoleGuardProps {
  rol: RolNombre;
  allow: RolNombre[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Oculta contenido dentro de una página según el rol — el middleware ya protege la ruta completa. */
export function RoleGuard({ rol, allow, children, fallback = null }: RoleGuardProps) {
  return allow.includes(rol) ? children : fallback;
}
