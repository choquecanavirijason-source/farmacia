import type { RolNombre } from "@/lib/types";
import type { MenuIconName } from "@/lib/nav/menu-icons";

export interface MenuItem {
  href: string;
  label: string;
  iconName: MenuIconName;
  /** Roles con acceso. Fuente única usada por el sidebar y por el proxy (rutas protegidas). */
  roles: RolNombre[];
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

/** Grupo "Solo Administrador" — acceso total (borde azul en el modelo de navegación). */
const ADMIN_ONLY: MenuItem[] = [
  { href: "/usuarios", label: "Gestión de Usuarios", iconName: "users", roles: ["ADMINISTRADOR"] },
  { href: "/categorias", label: "Gestión de Categorías", iconName: "tags", roles: ["ADMINISTRADOR"] },
  { href: "/medicamentos", label: "Gestión de Medicamentos", iconName: "pill", roles: ["ADMINISTRADOR"] },
  { href: "/lotes", label: "Gestión de Lotes", iconName: "boxes", roles: ["ADMINISTRADOR"] },
  { href: "/proveedores", label: "Gestión de Proveedores", iconName: "truck", roles: ["ADMINISTRADOR"] },
  { href: "/compras", label: "Registro de Compras", iconName: "shopping-cart", roles: ["ADMINISTRADOR"] },
  { href: "/reportes", label: "Reportes", iconName: "bar-chart", roles: ["ADMINISTRADOR"] },
];

/** Grupo "Administrador y Vendedor" — acceso limitado (borde negro en el modelo de navegación). */
const ADMIN_Y_VENDEDOR: MenuItem[] = [
  { href: "/clientes", label: "Gestión de Clientes", iconName: "contact", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { href: "/ventas", label: "Registro de Ventas", iconName: "shopping-bag", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { href: "/inventario", label: "Consulta de Inventario", iconName: "clipboard-list", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { href: "/caja", label: "Gestión de Caja", iconName: "wallet", roles: ["ADMINISTRADOR", "VENDEDOR"] },
];

export const MENU_GROUPS: MenuGroup[] = [
  { label: "Operación diaria", items: ADMIN_Y_VENDEDOR },
  { label: "Administración (solo administrador)", items: ADMIN_ONLY },
];

export const ALL_MENU_ITEMS: MenuItem[] = MENU_GROUPS.flatMap((g) => g.items);

/**
 * Rutas protegidas que no aparecen en el sidebar (según el modelo de
 * navegación UWE original) pero sí necesitan guard de rol — ej. Configuración
 * de la empresa, accesible desde el menú del usuario en el topbar.
 */
const EXTRA_PROTECTED_ROUTES: MenuItem[] = [
  { href: "/configuracion", label: "Configuración", iconName: "users", roles: ["ADMINISTRADOR"] },
];

export function menuItemsForRole(rol: RolNombre): MenuItem[] {
  return ALL_MENU_ITEMS.filter((item) => item.roles.includes(rol));
}

/** Roles permitidos para una ruta dada, o null si la ruta no está protegida por rol. */
export function rolesAllowedForPath(pathname: string): RolNombre[] | null {
  const item = [...ALL_MENU_ITEMS, ...EXTRA_PROTECTED_ROUTES].find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );
  return item ? item.roles : null;
}
