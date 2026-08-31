import type { RolNombre } from "@/lib/types";
import type { MenuIconName } from "@/lib/nav/menu-icons";
import { PERMISSIONS } from "@/lib/constants/permissions";

export interface MenuItem {
  href?: string;
  label: string;
  iconName: MenuIconName;
  roles?: RolNombre[];
  permission?: string;
  children?: MenuItem[];
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Principal",
    items: [
      {
        href: "/dashboard",
        label: "Panel Principal",
        iconName: "dashboard",
        roles: ["ADMINISTRADOR", "VENDEDOR"],
      },
    ],
  },
  {
    label: "Operación Comercial",
    items: [
      {
        label: "Ventas y Caja",
        iconName: "shopping-bag",
        children: [
          {
            href: "/ventas",
            label: "Punto de Venta (POS)",
            iconName: "shopping-bag",
            permission: PERMISSIONS.VIEW_SALES,
            roles: ["ADMINISTRADOR", "VENDEDOR"],
          },
          {
            href: "/caja",
            label: "Gestión de Caja",
            iconName: "wallet",
            permission: PERMISSIONS.VIEW_CASH_REGISTERS,
            roles: ["ADMINISTRADOR", "VENDEDOR"],
          },
        ],
      },
      {
        href: "/clientes",
        label: "Gestión de Clientes",
        iconName: "contact",
        permission: PERMISSIONS.VIEW_CLIENTS,
        roles: ["ADMINISTRADOR", "VENDEDOR"],
      },
    ],
  },
  {
    label: "Inventario y Catálogo",
    items: [
      {
        label: "Gestión de Catálogo",
        iconName: "pill",
        children: [
          {
            href: "/medicamentos",
            label: "Medicamentos",
            iconName: "pill",
            permission: PERMISSIONS.VIEW_MEDICAMENTS,
            roles: ["ADMINISTRADOR"],
          },
          {
            href: "/lotes",
            label: "Lotes y Stock",
            iconName: "boxes",
            permission: PERMISSIONS.VIEW_BATCHES,
            roles: ["ADMINISTRADOR"],
          },
          {
            href: "/categorias",
            label: "Categorías y Catálogos",
            iconName: "tags",
            permission: PERMISSIONS.VIEW_CATEGORIES,
            roles: ["ADMINISTRADOR"],
          },
        ],
      },
      {
        href: "/inventario",
        label: "Consulta de Inventario",
        iconName: "clipboard-list",
        permission: PERMISSIONS.VIEW_INVENTORY,
        roles: ["ADMINISTRADOR", "VENDEDOR"],
      },
    ],
  },
  {
    label: "Abastecimiento",
    items: [
      {
        label: "Compras y Proveedores",
        iconName: "shopping-cart",
        children: [
          {
            href: "/compras",
            label: "Registro de Compras",
            iconName: "shopping-cart",
            permission: PERMISSIONS.VIEW_PURCHASES,
            roles: ["ADMINISTRADOR"],
          },
          {
            href: "/proveedores",
            label: "Directorio de Proveedores",
            iconName: "truck",
            permission: PERMISSIONS.VIEW_SUPPLIERS,
            roles: ["ADMINISTRADOR"],
          },
        ],
      },
    ],
  },
  {
    label: "Administración y Seguridad",
    items: [
      {
        label: "Control de Accesos",
        iconName: "shield",
        children: [
          {
            href: "/usuarios",
            label: "Gestión de Usuarios",
            iconName: "users",
            permission: PERMISSIONS.VIEW_USERS,
            roles: ["ADMINISTRADOR"],
          },
          {
            href: "/roles",
            label: "Roles y Permisos",
            iconName: "shield",
            permission: PERMISSIONS.VIEW_ROLES,
            roles: ["ADMINISTRADOR"],
          },
        ],
      },
      {
        label: "Métricas y Auditoría",
        iconName: "bar-chart",
        children: [
          {
            href: "/reportes",
            label: "Reportes Estadísticos",
            iconName: "bar-chart",
            permission: PERMISSIONS.VIEW_REPORTS,
            roles: ["ADMINISTRADOR"],
          },
          {
            href: "/actividades",
            label: "Registro de Actividades",
            iconName: "history",
            permission: PERMISSIONS.VIEW_AUDITS,
            roles: ["ADMINISTRADOR"],
          },
        ],
      },
      {
        href: "/configuracion",
        label: "Configuración de Empresa",
        iconName: "settings",
        permission: PERMISSIONS.VIEW_SETTINGS,
        roles: ["ADMINISTRADOR"],
      },
    ],
  },
];

/**
 * Aplana todos los elementos y subelementos de menú para verificación de rutas y roles
 */
function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    if (item.href) {
      result.push(item);
    }
    if (item.children && item.children.length > 0) {
      result.push(...flattenMenuItems(item.children));
    }
  }
  return result;
}

export const ALL_MENU_ITEMS: MenuItem[] = flattenMenuItems(
  MENU_GROUPS.flatMap((g) => g.items)
);

export function menuItemsForRole(rol: RolNombre): MenuItem[] {
  return ALL_MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));
}

/**
 * Filtra los grupos y subniveles según los permisos otorgados al usuario
 */
export function filterMenuByPermissions(
  can: (permission: string) => boolean
): MenuGroup[] {
  function filterItem(item: MenuItem): MenuItem | null {
    if (item.children && item.children.length > 0) {
      const allowedChildren = item.children
        .map(filterItem)
        .filter((child): child is MenuItem => child !== null);

      if (allowedChildren.length === 0) return null;

      return {
        ...item,
        children: allowedChildren,
      };
    }

    if (item.permission && !can(item.permission)) {
      return null;
    }

    return item;
  }

  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .map(filterItem)
      .filter((item): item is MenuItem => item !== null),
  })).filter((group) => group.items.length > 0);
}

export function canAccessPath(
  pathname: string,
  can: (permission: string) => boolean
): boolean {
  if (pathname === "/dashboard" || pathname === "/") return true;

  const item = ALL_MENU_ITEMS.find(
    (i) => i.href && (pathname === i.href || pathname.startsWith(`${i.href}/`))
  );

  if (!item) return true; // Ruta pública o no restringida por menú

  return item.permission ? can(item.permission) : true;
}

export function rolesAllowedForPath(pathname: string): RolNombre[] | null {
  const item = ALL_MENU_ITEMS.find(
    (i) => i.href && (pathname === i.href || pathname.startsWith(`${i.href}/`))
  );
  return item ? (item.roles ?? null) : null;
}
