// Exportación de todos los módulos de tipos individuales (en inglés)
export * from "./client";
export * from "./category";
export * from "./presentation";
export * from "./laboratory";
export * from "./supplier";
export * from "./medicament";
export * from "./batch";
export * from "./user";
export * from "./role";
export * from "./permission";
export * from "./session";
export * from "./sale";
export * from "./purchase";
export * from "./cash-register";
export * from "./company";
export * from "./inventory";
export * from "./session";
export * from "./pagination";
export * from "./api";
export * from "./audit";

// Aliases de compatibilidad
import type { IClient } from "./client";
import type { ICategory } from "./category";
import type { IPresentation } from "./presentation";
import type { ILaboratory } from "./laboratory";
import type { ISupplier } from "./supplier";
import type { IMedicament } from "./medicament";
import type { IBatch } from "./batch";
import type { IUser } from "./user";
import type { ISale, ISaleDetail, IInvoice, SaleStatus } from "./sale";
import type { IPurchase, IPurchaseDetail } from "./purchase";
import type { ICashRegister, ICashMovement, CashRegisterStatus, CashMovementType } from "./cash-register";
import type { ICompany } from "./company";
import type { IKardexMovement, KardexType, AdjustmentReason } from "./inventory";
import type { ISession, RoleName } from "./session";
import { ADJUSTMENT_REASONS } from "./inventory";
import { PAYMENT_METHODS } from "./sale";

export type Cliente = IClient & {
  id_cliente: number;
  nombre: string;
  ci: string;
  nit: string;
  telefono: string;
  direccion: string;
};

export type Categoria = ICategory & {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
};

export type Presentacion = IPresentation & {
  id_presentacion: number;
  nombre: string;
  descripcion?: string | null;
};

export type Laboratorio = ILaboratory & {
  id_laboratorio: number;
  nombre: string;
  pais?: string | null;
  telefono?: string | null;
};

export type Proveedor = ISupplier & {
  id_proveedor: number;
  nombre: string;
  nit: string;
  telefono: string;
  direccion: string;
  email: string;
};

export type Medicamento = IMedicament & {
  id_medicamento: number;
  codigo: string;
  nombre: string;
  concentracion: string;
  precio_venta: number;
  stock_minimo: number;
  requiere_receta: boolean;
  estado: "activo" | "inactivo";
  id_categoria: number;
  id_presentacion: number;
  id_laboratorio: number;
};

export type Lote = IBatch & {
  id_lote: number;
  id_medicamento: number;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad_actual: number;
  precio_compra: number;
};

export type Usuario = IUser & {
  id_usuario: number;
  nombre: string;
  usuario: string;
  rol: RoleName;
  estado: "activo" | "inactivo";
};

export type Venta = ISale & {
  id_venta: number;
  fecha_hora: string;
  total: number;
  estado: SaleStatus;
  id_cliente: number;
  id_usuario: number;
  id_caja: number;
  forma_pago: string;
};

export type DetalleVenta = ISaleDetail & {
  id_detalle: number;
  id_venta: number;
  id_medicamento: number;
  id_lote: number;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  subtotal: number;
};

export type Factura = IInvoice & {
  id_factura: number;
  id_venta: number;
  numero_factura: string;
  nit_cliente: string;
  razon_social: string;
  fecha_emision: string;
  monto_total: number;
};

export type Compra = IPurchase & {
  id_compra: number;
  id_proveedor: number;
  numero_factura: string;
  fecha_compra: string;
  total: number;
};

export type DetalleCompra = IPurchaseDetail & {
  id_detalle: number;
  id_compra: number;
  id_medicamento: number;
  id_lote: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Caja = ICashRegister & {
  id_caja: number;
  fecha_apertura: string;
  monto_apertura: number;
  fecha_cierre: string | null;
  monto_cierre: number | null;
  monto_esperado: number | null;
  estado: CashRegisterStatus;
  id_usuario: number;
};

export type MovimientoCaja = ICashMovement & {
  id_movimiento: number;
  id_caja: number;
  tipo: CashMovementType;
  monto: number;
  motivo: string;
  fecha_hora: string;
};

export type Empresa = ICompany & {
  id_empresa: number;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  logo: string;
};

export type KardexMovimiento = IKardexMovement & {
  id_movimiento: number;
  id_lote: number;
  tipo: KardexType;
  cantidad: number;
  saldo: number;
  motivo: string;
  fecha_hora: string;
};

export type Sesion = ISession;
export type RolNombre = RoleName;
export type MovimientoCajaTipo = CashMovementType;
export type MotivoAjuste = AdjustmentReason;
export const MOTIVOS_AJUSTE = ADJUSTMENT_REASONS;
export const FORMAS_PAGO = PAYMENT_METHODS;
