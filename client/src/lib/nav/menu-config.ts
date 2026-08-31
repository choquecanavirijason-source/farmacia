import type { RolNombre } from "@/lib/types";
import type { MenuIconName } from "@/lib/nav/menu-icons";

export interface MenuItem {
  href: string;
  label: string;
  iconName: MenuIconName;
  roles?: RolNombre[];
  permission?: string;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const OPERACION_ITEMS: MenuItem[] = [
  { href: "/clientes", label: "Gestión de Clientes", iconName: "contact", permission: "view clients", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { href: "/ventas", label: "Registro de Ventas", iconName: "shopping-bag", permission: "view sales", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { href: "/inventario", label: "Consulta de Inventario", iconName: "clipboard-list", permission: "view inventory", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { href: "/caja", label: "Gestión de Caja", iconName: "wallet", permission: "view cash registers", roles: ["ADMINISTRADOR", "VENDEDOR"] },
];

const ADMINISTRACION_ITEMS: MenuItem[] = [
  { href: "/usuarios", label: "Gestión de Usuarios", iconName: "users", permission: "view users", roles: ["ADMINISTRADOR"] },
  { href: "/roles", label: "Roles y Permisos", iconName: "shield", permission: "view roles", roles: ["ADMINISTRADOR"] },
  { href: "/categorias", label: "Gestión de Categorías", iconName: "tags", permission: "view categories", roles: ["ADMINISTRADOR"] },
  { href: "/medicamentos", label: "Gestión de Medicamentos", iconName: "pill", permission: "view medicaments", roles: ["ADMINISTRADOR"] },
  { href: "/lotes", label: "Gestión de Lotes", iconName: "boxes", permission: "view batches", roles: ["ADMINISTRADOR"] },
  { href: "/proveedores", label: "Gestión de Proveedores", iconName: "truck", permission: "view suppliers", roles: ["ADMINISTRADOR"] },
  { href: "/compras", label: "Registro de Compras", iconName: "shopping-cart", permission: "view purchases", roles: ["ADMINISTRADOR"] },
  { href: "/reportes", label: "Reportes", iconName: "bar-chart", permission: "view reports", roles: ["ADMINISTRADOR"] },
  { href: "/actividades", label: "Registro de Actividades", iconName: "history", permission: "view audits", roles: ["ADMINISTRADOR"] },
];

export const MENU_GROUPS: MenuGroup[] = [
  { label: "Operación diaria", items: OPERACION_ITEMS },
  { label: "Administración", items: ADMINISTRACION_ITEMS },
];

export const ALL_MENU_ITEMS: MenuItem[] = MENU_GROUPS.flatMap((g) => g.items);

const EXTRA_PROTECTED_ROUTES: MenuItem[] = [
  { href: "/configuracion", label: "Configuración", iconName: "settings", permission: "view settings", roles: ["ADMINISTRADOR"] },
];

export function menuItemsForRole(rol: RolNombre): MenuItem[] {
  return ALL_MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));
}

export function filterMenuByPermissions(
  can: (permission: string) => boolean
): MenuGroup[] {
  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => (item.permission ? can(item.permission) : true)),
  })).filter((group) => group.items.length > 0);
}

export function canAccessPath(
  pathname: string,
  can: (permission: string) => boolean
): boolean {
  if (pathname === "/dashboard" || pathname === "/") return true;

  const item = [...ALL_MENU_ITEMS, ...EXTRA_PROTECTED_ROUTES].find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );

  if (!item) return true; // Ruta no protegida por menú

  return item.permission ? can(item.permission) : true;
}

export function rolesAllowedForPath(pathname: string): RolNombre[] | null {
  const item = [...ALL_MENU_ITEMS, ...EXTRA_PROTECTED_ROUTES].find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );
  return item ? (item.roles ?? null) : null;
}
