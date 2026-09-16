/**
 * Constantes de Permisos del Sistema
 * - Llaves en inglés como identificadores de código
 * - Valores exactos para autorización en el backend
 * - Etiquetas y descripciones en español para la interfaz de usuario
 */

export const PERMISSIONS = {
  // Clientes
  VIEW_CLIENTS: "view clients",
  CREATE_CLIENTS: "create clients",
  EDIT_CLIENTS: "edit clients",
  DELETE_CLIENTS: "delete clients",
  RESTORE_CLIENTS: "restore clients",
  EXPORT_CLIENTS: "export clients",

  // Medicamentos
  VIEW_MEDICAMENTS: "view medicaments",
  CREATE_MEDICAMENTS: "create medicaments",
  EDIT_MEDICAMENTS: "edit medicaments",
  DELETE_MEDICAMENTS: "delete medicaments",
  RESTORE_MEDICAMENTS: "restore medicaments",
  EXPORT_MEDICAMENTS: "export medicaments",

  // Categorías
  VIEW_CATEGORIES: "view categories",
  CREATE_CATEGORIES: "create categories",
  EDIT_CATEGORIES: "edit categories",
  DELETE_CATEGORIES: "delete categories",
  RESTORE_CATEGORIES: "restore categories",
  EXPORT_CATEGORIES: "export categories",

  // Presentaciones
  VIEW_PRESENTATIONS: "view presentations",
  CREATE_PRESENTATIONS: "create presentations",
  EDIT_PRESENTATIONS: "edit presentations",
  DELETE_PRESENTATIONS: "delete presentations",
  RESTORE_PRESENTATIONS: "restore presentations",
  EXPORT_PRESENTATIONS: "export presentations",

  // Laboratorios
  VIEW_LABORATORIES: "view laboratories",
  CREATE_LABORATORIES: "create laboratories",
  EDIT_LABORATORIES: "edit laboratories",
  DELETE_LABORATORIES: "delete laboratories",
  RESTORE_LABORATORIES: "restore laboratories",
  EXPORT_LABORATORIES: "export laboratories",

  // Lotes y Stock
  VIEW_BATCHES: "view batches",
  CREATE_BATCHES: "create batches",
  EDIT_BATCHES: "edit batches",
  DELETE_BATCHES: "delete batches",
  RESTORE_BATCHES: "restore batches",
  EXPORT_BATCHES: "export batches",
  DISPOSE_BATCHES: "dispose batches",

  // Proveedores
  VIEW_SUPPLIERS: "view suppliers",
  CREATE_SUPPLIERS: "create suppliers",
  EDIT_SUPPLIERS: "edit suppliers",
  DELETE_SUPPLIERS: "delete suppliers",
  RESTORE_SUPPLIERS: "restore suppliers",
  EXPORT_SUPPLIERS: "export suppliers",

  // Ventas y POS
  VIEW_SALES: "view sales",
  CREATE_SALES: "create sales",
  VOID_SALES: "void sales",
  EXPORT_SALES: "export sales",

  // Compras
  VIEW_PURCHASES: "view purchases",
  CREATE_PURCHASES: "create purchases",
  EXPORT_PURCHASES: "export purchases",

  // Caja
  VIEW_CASH_REGISTERS: "view cash registers",
  OPEN_CASH_REGISTERS: "open cash registers",
  CLOSE_CASH_REGISTERS: "close cash registers",
  CREATE_CASH_MOVEMENTS: "create cash movements",
  EXPORT_CASH_REGISTERS: "export cash registers",

  // Inventario
  VIEW_INVENTORY: "view inventory",

  // Reportes
  VIEW_REPORTS: "view reports",

  // Usuarios
  VIEW_USERS: "view users",
  CREATE_USERS: "create users",
  EDIT_USERS: "edit users",
  DELETE_USERS: "delete users",
  RESTORE_USERS: "restore users",
  EXPORT_USERS: "export users",

  // Roles y Permisos
  VIEW_ROLES: "view roles",
  CREATE_ROLES: "create roles",
  EDIT_ROLES: "edit roles",
  DELETE_ROLES: "delete roles",

  // Configuración
  VIEW_SETTINGS: "view settings",
  EDIT_SETTINGS: "edit settings",

  // Auditorías
  VIEW_AUDITS: "view audits",
  EXPORT_AUDITS: "export audits",

  // Sucursales
  VIEW_BRANCHES: "view branches",
  CREATE_BRANCHES: "create branches",
  EDIT_BRANCHES: "edit branches",
  DELETE_BRANCHES: "delete branches",
  RESTORE_BRANCHES: "restore branches",
  EXPORT_BRANCHES: "export branches",
  MANAGE_BRANCH_USERS: "manage branch users",
  CREATE_BRANCH_TRANSFERS: "create branch transfers",
  VIEW_BRANCH_TRANSFERS: "view branch transfers",
  EXPORT_BRANCH_TRANSFERS: "export branch transfers",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Etiquetas legibles en español para cada permiso
 */
export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  // Clientes
  [PERMISSIONS.VIEW_CLIENTS]: "Ver listado de clientes",
  [PERMISSIONS.CREATE_CLIENTS]: "Crear nuevos clientes",
  [PERMISSIONS.EDIT_CLIENTS]: "Editar datos de clientes",
  [PERMISSIONS.DELETE_CLIENTS]: "Eliminar clientes",
  [PERMISSIONS.RESTORE_CLIENTS]: "Restaurar clientes eliminados",
  [PERMISSIONS.EXPORT_CLIENTS]: "Exportar clientes (Excel / PDF)",

  // Medicamentos
  [PERMISSIONS.VIEW_MEDICAMENTS]: "Ver catálogo de medicamentos",
  [PERMISSIONS.CREATE_MEDICAMENTS]: "Registrar medicamentos",
  [PERMISSIONS.EDIT_MEDICAMENTS]: "Editar medicamentos",
  [PERMISSIONS.DELETE_MEDICAMENTS]: "Eliminar medicamentos",
  [PERMISSIONS.RESTORE_MEDICAMENTS]: "Restaurar medicamentos eliminados",
  [PERMISSIONS.EXPORT_MEDICAMENTS]: "Exportar medicamentos",

  // Categorías
  [PERMISSIONS.VIEW_CATEGORIES]: "Ver categorías",
  [PERMISSIONS.CREATE_CATEGORIES]: "Crear categorías",
  [PERMISSIONS.EDIT_CATEGORIES]: "Editar categorías",
  [PERMISSIONS.DELETE_CATEGORIES]: "Eliminar categorías",
  [PERMISSIONS.RESTORE_CATEGORIES]: "Restaurar categorías",
  [PERMISSIONS.EXPORT_CATEGORIES]: "Exportar categorías",

  // Presentaciones
  [PERMISSIONS.VIEW_PRESENTATIONS]: "Ver presentaciones",
  [PERMISSIONS.CREATE_PRESENTATIONS]: "Crear presentaciones",
  [PERMISSIONS.EDIT_PRESENTATIONS]: "Editar presentaciones",
  [PERMISSIONS.DELETE_PRESENTATIONS]: "Eliminar presentaciones",
  [PERMISSIONS.RESTORE_PRESENTATIONS]: "Restaurar presentaciones",
  [PERMISSIONS.EXPORT_PRESENTATIONS]: "Exportar presentaciones",

  // Laboratorios
  [PERMISSIONS.VIEW_LABORATORIES]: "Ver laboratorios",
  [PERMISSIONS.CREATE_LABORATORIES]: "Crear laboratorios",
  [PERMISSIONS.EDIT_LABORATORIES]: "Editar laboratorios",
  [PERMISSIONS.DELETE_LABORATORIES]: "Eliminar laboratorios",
  [PERMISSIONS.RESTORE_LABORATORIES]: "Restaurar laboratorios",
  [PERMISSIONS.EXPORT_LABORATORIES]: "Exportar laboratorios",

  // Lotes y Stock
  [PERMISSIONS.VIEW_BATCHES]: "Ver lotes y stock",
  [PERMISSIONS.CREATE_BATCHES]: "Registrar nuevos lotes",
  [PERMISSIONS.EDIT_BATCHES]: "Editar lote / fecha vencimiento",
  [PERMISSIONS.DELETE_BATCHES]: "Eliminar lotes",
  [PERMISSIONS.RESTORE_BATCHES]: "Restaurar lotes",
  [PERMISSIONS.EXPORT_BATCHES]: "Exportar lotes",
  [PERMISSIONS.DISPOSE_BATCHES]: "Dar de baja stock / Ajuste kardex",

  // Proveedores
  [PERMISSIONS.VIEW_SUPPLIERS]: "Ver proveedores",
  [PERMISSIONS.CREATE_SUPPLIERS]: "Crear proveedores",
  [PERMISSIONS.EDIT_SUPPLIERS]: "Editar proveedores",
  [PERMISSIONS.DELETE_SUPPLIERS]: "Eliminar proveedores",
  [PERMISSIONS.RESTORE_SUPPLIERS]: "Restaurar proveedores",
  [PERMISSIONS.EXPORT_SUPPLIERS]: "Exportar proveedores",

  // Ventas y POS
  [PERMISSIONS.VIEW_SALES]: "Ver historial de ventas",
  [PERMISSIONS.CREATE_SALES]: "Realizar ventas (Punto de Venta)",
  [PERMISSIONS.VOID_SALES]: "Anular ventas registradas",
  [PERMISSIONS.EXPORT_SALES]: "Exportar ventas",

  // Compras
  [PERMISSIONS.VIEW_PURCHASES]: "Ver historial de compras",
  [PERMISSIONS.CREATE_PURCHASES]: "Registrar compras de mercadería",
  [PERMISSIONS.EXPORT_PURCHASES]: "Exportar compras",

  // Caja
  [PERMISSIONS.VIEW_CASH_REGISTERS]: "Ver movimientos y cierres de caja",
  [PERMISSIONS.OPEN_CASH_REGISTERS]: "Abrir caja de turno",
  [PERMISSIONS.CLOSE_CASH_REGISTERS]: "Cerrar caja y cuadrar arqueo",
  [PERMISSIONS.CREATE_CASH_MOVEMENTS]: "Registrar ingresos / egresos manuales",
  [PERMISSIONS.EXPORT_CASH_REGISTERS]: "Exportar registros de caja",

  // Inventario
  [PERMISSIONS.VIEW_INVENTORY]: "Consultar inventario general",

  // Reportes
  [PERMISSIONS.VIEW_REPORTS]: "Acceso a reportes y estadísticas",

  // Usuarios
  [PERMISSIONS.VIEW_USERS]: "Ver usuarios del sistema",
  [PERMISSIONS.CREATE_USERS]: "Crear usuarios",
  [PERMISSIONS.EDIT_USERS]: "Editar usuarios",
  [PERMISSIONS.DELETE_USERS]: "Eliminar usuarios",
  [PERMISSIONS.RESTORE_USERS]: "Restaurar usuarios eliminados",
  [PERMISSIONS.EXPORT_USERS]: "Exportar usuarios",

  // Roles y Permisos
  [PERMISSIONS.VIEW_ROLES]: "Ver roles y permisos",
  [PERMISSIONS.CREATE_ROLES]: "Crear roles",
  [PERMISSIONS.EDIT_ROLES]: "Editar roles y asignar permisos",
  [PERMISSIONS.DELETE_ROLES]: "Eliminar roles",

  // Configuración
  [PERMISSIONS.VIEW_SETTINGS]: "Ver configuración de empresa",
  [PERMISSIONS.EDIT_SETTINGS]: "Modificar datos y logo de empresa",

  // Auditorías
  [PERMISSIONS.VIEW_AUDITS]: "Ver registros de auditoría",
  [PERMISSIONS.EXPORT_AUDITS]: "Exportar auditorías",

  // Sucursales
  [PERMISSIONS.VIEW_BRANCHES]: "Ver sucursales",
  [PERMISSIONS.CREATE_BRANCHES]: "Crear sucursales",
  [PERMISSIONS.EDIT_BRANCHES]: "Editar sucursales",
  [PERMISSIONS.DELETE_BRANCHES]: "Eliminar sucursales",
  [PERMISSIONS.RESTORE_BRANCHES]: "Restaurar sucursales eliminadas",
  [PERMISSIONS.EXPORT_BRANCHES]: "Exportar sucursales",
  [PERMISSIONS.MANAGE_BRANCH_USERS]: "Asignar usuarios a sucursales",
  [PERMISSIONS.CREATE_BRANCH_TRANSFERS]: "Traspasar stock entre sucursales",
  [PERMISSIONS.VIEW_BRANCH_TRANSFERS]: "Ver historial de traspasos",
  [PERMISSIONS.EXPORT_BRANCH_TRANSFERS]: "Exportar traspasos",
};

/**
 * Estructura de módulos temáticos para la UI de gestión de permisos
 */
export interface IPermissionModuleDefinition {
  id: string;
  title: string;
  description: string;
  permissions: {
    code: PermissionCode;
    label: string;
  }[];
}

export const PERMISSION_MODULES: IPermissionModuleDefinition[] = [
  {
    id: "clients",
    title: "Clientes",
    description: "Acceso y gestión de clientes",
    permissions: [
      { code: PERMISSIONS.VIEW_CLIENTS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_CLIENTS] },
      { code: PERMISSIONS.CREATE_CLIENTS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_CLIENTS] },
      { code: PERMISSIONS.EDIT_CLIENTS, label: PERMISSION_LABELS[PERMISSIONS.EDIT_CLIENTS] },
      { code: PERMISSIONS.DELETE_CLIENTS, label: PERMISSION_LABELS[PERMISSIONS.DELETE_CLIENTS] },
      { code: PERMISSIONS.RESTORE_CLIENTS, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_CLIENTS] },
      { code: PERMISSIONS.EXPORT_CLIENTS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_CLIENTS] },
    ],
  },
  {
    id: "medicaments",
    title: "Medicamentos y Catálogos",
    description: "Gestión de productos, categorías, laboratorios y presentaciones",
    permissions: [
      { code: PERMISSIONS.VIEW_MEDICAMENTS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_MEDICAMENTS] },
      { code: PERMISSIONS.CREATE_MEDICAMENTS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_MEDICAMENTS] },
      { code: PERMISSIONS.EDIT_MEDICAMENTS, label: PERMISSION_LABELS[PERMISSIONS.EDIT_MEDICAMENTS] },
      { code: PERMISSIONS.DELETE_MEDICAMENTS, label: PERMISSION_LABELS[PERMISSIONS.DELETE_MEDICAMENTS] },
      { code: PERMISSIONS.RESTORE_MEDICAMENTS, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_MEDICAMENTS] },
      { code: PERMISSIONS.EXPORT_MEDICAMENTS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_MEDICAMENTS] },

      { code: PERMISSIONS.VIEW_CATEGORIES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_CATEGORIES] },
      { code: PERMISSIONS.CREATE_CATEGORIES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_CATEGORIES] },
      { code: PERMISSIONS.EDIT_CATEGORIES, label: PERMISSION_LABELS[PERMISSIONS.EDIT_CATEGORIES] },
      { code: PERMISSIONS.DELETE_CATEGORIES, label: PERMISSION_LABELS[PERMISSIONS.DELETE_CATEGORIES] },
      { code: PERMISSIONS.RESTORE_CATEGORIES, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_CATEGORIES] },
      { code: PERMISSIONS.EXPORT_CATEGORIES, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_CATEGORIES] },

      { code: PERMISSIONS.VIEW_PRESENTATIONS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_PRESENTATIONS] },
      { code: PERMISSIONS.CREATE_PRESENTATIONS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_PRESENTATIONS] },
      { code: PERMISSIONS.EDIT_PRESENTATIONS, label: PERMISSION_LABELS[PERMISSIONS.EDIT_PRESENTATIONS] },
      { code: PERMISSIONS.DELETE_PRESENTATIONS, label: PERMISSION_LABELS[PERMISSIONS.DELETE_PRESENTATIONS] },
      { code: PERMISSIONS.RESTORE_PRESENTATIONS, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_PRESENTATIONS] },
      { code: PERMISSIONS.EXPORT_PRESENTATIONS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_PRESENTATIONS] },

      { code: PERMISSIONS.VIEW_LABORATORIES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_LABORATORIES] },
      { code: PERMISSIONS.CREATE_LABORATORIES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_LABORATORIES] },
      { code: PERMISSIONS.EDIT_LABORATORIES, label: PERMISSION_LABELS[PERMISSIONS.EDIT_LABORATORIES] },
      { code: PERMISSIONS.DELETE_LABORATORIES, label: PERMISSION_LABELS[PERMISSIONS.DELETE_LABORATORIES] },
      { code: PERMISSIONS.RESTORE_LABORATORIES, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_LABORATORIES] },
      { code: PERMISSIONS.EXPORT_LABORATORIES, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_LABORATORIES] },
    ],
  },
  {
    id: "batches",
    title: "Lotes y Stock",
    description: "Control de vencimientos, ingresos de lote y bajas de stock",
    permissions: [
      { code: PERMISSIONS.VIEW_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_BATCHES] },
      { code: PERMISSIONS.CREATE_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_BATCHES] },
      { code: PERMISSIONS.EDIT_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.EDIT_BATCHES] },
      { code: PERMISSIONS.DELETE_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.DELETE_BATCHES] },
      { code: PERMISSIONS.RESTORE_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_BATCHES] },
      { code: PERMISSIONS.EXPORT_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_BATCHES] },
      { code: PERMISSIONS.DISPOSE_BATCHES, label: PERMISSION_LABELS[PERMISSIONS.DISPOSE_BATCHES] },
    ],
  },
  {
    id: "suppliers",
    title: "Proveedores",
    description: "Gestión de distribuidores y proveedores farmacéuticos",
    permissions: [
      { code: PERMISSIONS.VIEW_SUPPLIERS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_SUPPLIERS] },
      { code: PERMISSIONS.CREATE_SUPPLIERS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_SUPPLIERS] },
      { code: PERMISSIONS.EDIT_SUPPLIERS, label: PERMISSION_LABELS[PERMISSIONS.EDIT_SUPPLIERS] },
      { code: PERMISSIONS.DELETE_SUPPLIERS, label: PERMISSION_LABELS[PERMISSIONS.DELETE_SUPPLIERS] },
      { code: PERMISSIONS.RESTORE_SUPPLIERS, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_SUPPLIERS] },
      { code: PERMISSIONS.EXPORT_SUPPLIERS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_SUPPLIERS] },
    ],
  },
  {
    id: "sales",
    title: "Ventas y Punto de Venta (POS)",
    description: "Cobro en mostrador, emisión de facturas y anulación",
    permissions: [
      { code: PERMISSIONS.VIEW_SALES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_SALES] },
      { code: PERMISSIONS.CREATE_SALES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_SALES] },
      { code: PERMISSIONS.VOID_SALES, label: PERMISSION_LABELS[PERMISSIONS.VOID_SALES] },
      { code: PERMISSIONS.EXPORT_SALES, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_SALES] },
    ],
  },
  {
    id: "purchases",
    title: "Compras e Ingresos",
    description: "Registro de compras a proveedores con facturas",
    permissions: [
      { code: PERMISSIONS.VIEW_PURCHASES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_PURCHASES] },
      { code: PERMISSIONS.CREATE_PURCHASES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_PURCHASES] },
      { code: PERMISSIONS.EXPORT_PURCHASES, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_PURCHASES] },
    ],
  },
  {
    id: "cash_registers",
    title: "Caja y Turnos",
    description: "Apertura, arqueos, cierres y movimientos de efectivo",
    permissions: [
      { code: PERMISSIONS.VIEW_CASH_REGISTERS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_CASH_REGISTERS] },
      { code: PERMISSIONS.OPEN_CASH_REGISTERS, label: PERMISSION_LABELS[PERMISSIONS.OPEN_CASH_REGISTERS] },
      { code: PERMISSIONS.CLOSE_CASH_REGISTERS, label: PERMISSION_LABELS[PERMISSIONS.CLOSE_CASH_REGISTERS] },
      { code: PERMISSIONS.CREATE_CASH_MOVEMENTS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_CASH_MOVEMENTS] },
      { code: PERMISSIONS.EXPORT_CASH_REGISTERS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_CASH_REGISTERS] },
    ],
  },
  {
    id: "inventory",
    title: "Consulta de Inventario",
    description: "Vista consolidada de existencias e inventario valorizado",
    permissions: [
      { code: PERMISSIONS.VIEW_INVENTORY, label: PERMISSION_LABELS[PERMISSIONS.VIEW_INVENTORY] },
    ],
  },
  {
    id: "reports",
    title: "Reportes y Estadísticas",
    description: "Reportes de ventas, productos más vendidos y kardex",
    permissions: [
      { code: PERMISSIONS.VIEW_REPORTS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_REPORTS] },
    ],
  },
  {
    id: "users",
    title: "Usuarios y Accesos",
    description: "Cuentas de usuario y asignación de roles",
    permissions: [
      { code: PERMISSIONS.VIEW_USERS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_USERS] },
      { code: PERMISSIONS.CREATE_USERS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_USERS] },
      { code: PERMISSIONS.EDIT_USERS, label: PERMISSION_LABELS[PERMISSIONS.EDIT_USERS] },
      { code: PERMISSIONS.DELETE_USERS, label: PERMISSION_LABELS[PERMISSIONS.DELETE_USERS] },
      { code: PERMISSIONS.RESTORE_USERS, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_USERS] },
      { code: PERMISSIONS.EXPORT_USERS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_USERS] },
    ],
  },
  {
    id: "roles",
    title: "Roles y Permisos",
    description: "Configuración de perfiles y permisos del sistema",
    permissions: [
      { code: PERMISSIONS.VIEW_ROLES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_ROLES] },
      { code: PERMISSIONS.CREATE_ROLES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_ROLES] },
      { code: PERMISSIONS.EDIT_ROLES, label: PERMISSION_LABELS[PERMISSIONS.EDIT_ROLES] },
      { code: PERMISSIONS.DELETE_ROLES, label: PERMISSION_LABELS[PERMISSIONS.DELETE_ROLES] },
    ],
  },
  {
    id: "settings",
    title: "Configuración de Empresa",
    description: "Datos fiscales, logotipo y razón social de la farmacia",
    permissions: [
      { code: PERMISSIONS.VIEW_SETTINGS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_SETTINGS] },
      { code: PERMISSIONS.EDIT_SETTINGS, label: PERMISSION_LABELS[PERMISSIONS.EDIT_SETTINGS] },
    ],
  },
  {
    id: "audits",
    title: "Registro de Auditoría",
    description: "Trazabilidad y registro de cambios en el sistema",
    permissions: [
      { code: PERMISSIONS.VIEW_AUDITS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_AUDITS] },
      { code: PERMISSIONS.EXPORT_AUDITS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_AUDITS] },
    ],
  },
  {
    id: "branches",
    title: "Sucursales",
    description: "Gestión de sucursales y asignación de usuarios",
    permissions: [
      { code: PERMISSIONS.VIEW_BRANCHES, label: PERMISSION_LABELS[PERMISSIONS.VIEW_BRANCHES] },
      { code: PERMISSIONS.CREATE_BRANCHES, label: PERMISSION_LABELS[PERMISSIONS.CREATE_BRANCHES] },
      { code: PERMISSIONS.EDIT_BRANCHES, label: PERMISSION_LABELS[PERMISSIONS.EDIT_BRANCHES] },
      { code: PERMISSIONS.DELETE_BRANCHES, label: PERMISSION_LABELS[PERMISSIONS.DELETE_BRANCHES] },
      { code: PERMISSIONS.RESTORE_BRANCHES, label: PERMISSION_LABELS[PERMISSIONS.RESTORE_BRANCHES] },
      { code: PERMISSIONS.EXPORT_BRANCHES, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_BRANCHES] },
      { code: PERMISSIONS.MANAGE_BRANCH_USERS, label: PERMISSION_LABELS[PERMISSIONS.MANAGE_BRANCH_USERS] },
      { code: PERMISSIONS.CREATE_BRANCH_TRANSFERS, label: PERMISSION_LABELS[PERMISSIONS.CREATE_BRANCH_TRANSFERS] },
      { code: PERMISSIONS.VIEW_BRANCH_TRANSFERS, label: PERMISSION_LABELS[PERMISSIONS.VIEW_BRANCH_TRANSFERS] },
      { code: PERMISSIONS.EXPORT_BRANCH_TRANSFERS, label: PERMISSION_LABELS[PERMISSIONS.EXPORT_BRANCH_TRANSFERS] },
    ],
  },
];
