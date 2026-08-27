// Modelo conceptual — Administración/Usuarios

/** Respuesta paginada estándar de Laravel (`paginate()`). */
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  total: number;
  per_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export type RolNombre = "ADMINISTRADOR" | "VENDEDOR";

export interface Rol {
  id_rol: number;
  nombre: RolNombre;
  descripcion: string;
}

export type UsuarioEstado = "activo" | "inactivo";

export interface Usuario {
  id_usuario: number;
  nombre: string;
  usuario: string;
  estado: UsuarioEstado;
  fecha_registro: string; // ISO date
  id_rol: number;
  rol: RolNombre;
}

/** Datos de sesión guardados en la cookie (no incluye contraseña). */
export interface Sesion {
  id_usuario: number;
  nombre: string;
  usuario: string;
  rol: RolNombre;
  token: string;
}

// Modelo conceptual — Inventario y Catálogo

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
}

export interface Presentacion {
  id_presentacion: number;
  nombre: string;
  descripcion: string;
}

export interface Laboratorio {
  id_laboratorio: number;
  nombre: string;
  pais: string;
  telefono: string;
}

export type MedicamentoEstado = "activo" | "inactivo";

export interface Medicamento {
  id_medicamento: number;
  codigo: string;
  nombre: string;
  concentracion: string;
  precio_venta: number;
  stock_minimo: number;
  requiere_receta: boolean;
  estado: MedicamentoEstado;
  id_categoria: number;
  id_presentacion: number;
  id_laboratorio: number;
}

export interface Lote {
  id_lote: number;
  numero_lote: string;
  fecha_vencimiento: string; // ISO date
  cantidad_actual: number;
  precio_compra: number;
  id_medicamento: number;
}

export type KardexTipo = "entrada" | "salida" | "ajuste";

export const MOTIVOS_AJUSTE = ["Vencimiento", "Daño", "Extravío", "Otro"] as const;
export type MotivoAjuste = (typeof MOTIVOS_AJUSTE)[number];

/** Movimiento de kardex: `cantidad` es el delta con signo (+entrada, -salida/ajuste), `saldo` es el resultante. */
export interface KardexMovimiento {
  id_movimiento: number;
  id_lote: number;
  tipo: KardexTipo;
  cantidad: number;
  saldo: number;
  motivo: string;
  fecha: string; // ISO datetime
}

// Modelo conceptual — Ventas, Facturación y Caja

export const FORMAS_PAGO = ["Efectivo", "Tarjeta", "QR", "Transferencia"] as const;
export type FormaPagoNombre = (typeof FORMAS_PAGO)[number];

export type VentaEstado = "activa" | "anulada";

export interface Venta {
  id_venta: number;
  fecha: string; // ISO datetime
  total: number;
  estado: VentaEstado;
  id_cliente: number;
  id_usuario: number;
  id_caja: number;
  forma_pago: FormaPagoNombre;
}

/** Cada línea descuenta de un único lote (FEFO: el de vencimiento más próximo con stock suficiente). */
export interface DetalleVenta {
  id_detalle_venta: number;
  id_venta: number;
  id_medicamento: number;
  id_lote: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Factura {
  id_factura: number;
  id_venta: number;
  numero_factura: string;
  nit_cliente: string;
  razon_social: string;
  fecha_emision: string; // ISO datetime
  total: number;
}

// Modelo conceptual — Compras y Proveedores

/** Datos de la empresa impresos en comprobantes/facturas (solo un registro). */
export interface Empresa {
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  /** Data URL (base64) del logo, o null si no se subió ninguno. */
  logo: string | null;
}

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  nit: string;
  telefono: string;
  direccion: string;
  email: string;
}

export type CajaEstado = "abierta" | "cerrada";

export interface Caja {
  id_caja: number;
  fecha_apertura: string; // ISO datetime
  monto_apertura: number;
  fecha_cierre: string | null; // ISO datetime
  monto_cierre: number | null;
  /** Monto esperado calculado al momento del cierre (apertura + ingresos - egresos). Null mientras está abierta. */
  monto_esperado_cierre: number | null;
  estado: CajaEstado;
}

export type MovimientoCajaTipo = "ingreso" | "egreso";

export interface MovimientoCaja {
  id_movimiento: number;
  id_caja: number;
  tipo: MovimientoCajaTipo;
  monto: number;
  concepto: string;
  fecha: string; // ISO datetime
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: "activo" | "inactivo";
  fecha_registro: string;
}

export interface Compra {
  id_compra: number;
  numero_factura: string;
  fecha: string; // ISO date
  total: number;
  id_proveedor: number;
}

/** Cada línea de compra crea un lote nuevo (`id_lote`) — así ingresa el stock. */
export interface DetalleCompra {
  id_detalle_compra: number;
  id_compra: number;
  id_medicamento: number;
  id_lote: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}
