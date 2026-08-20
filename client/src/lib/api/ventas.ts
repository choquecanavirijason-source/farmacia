import { apiFetch } from "@/lib/api/http";
import type { DetalleVenta, Factura, FormaPagoNombre, Venta } from "@/lib/types";

interface VentaApi extends Omit<Venta, "total"> {
  total: string;
}

function toVenta(v: VentaApi): Venta {
  return { ...v, total: Number(v.total) };
}

interface DetalleVentaApi extends Omit<DetalleVenta, "precio_unitario" | "subtotal"> {
  precio_unitario: string;
  subtotal: string;
}

function toDetalle(d: DetalleVentaApi): DetalleVenta {
  return { ...d, precio_unitario: Number(d.precio_unitario), subtotal: Number(d.subtotal) };
}

interface FacturaApi extends Omit<Factura, "total"> {
  total: string;
}

function toFactura(f: FacturaApi): Factura {
  return { ...f, total: Number(f.total) };
}

export async function fetchVentas(): Promise<Venta[]> {
  const data = await apiFetch<VentaApi[]>("/ventas");
  return data.map(toVenta);
}

export async function fetchDetallesByVenta(id_venta: number): Promise<DetalleVenta[]> {
  const data = await apiFetch<DetalleVentaApi[]>(`/ventas/${id_venta}/detalles`);
  return data.map(toDetalle);
}

export async function fetchFacturaByVenta(id_venta: number): Promise<Factura | null> {
  const data = await apiFetch<FacturaApi | null>(`/ventas/${id_venta}/factura`);
  return data ? toFactura(data) : null;
}

export interface VentaItemInput {
  id_medicamento: number;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaInput {
  id_cliente: number;
  id_usuario: number;
  id_caja: number;
  forma_pago: FormaPagoNombre;
  nit_cliente: string;
  razon_social: string;
  items: VentaItemInput[];
}

/**
 * Registra la venta. El backend resuelve el lote FEFO de cada línea,
 * descuenta stock, genera kardex/factura/pago e ingreso en caja — todo en
 * una sola transacción (ver VentaController@store).
 */
export async function crearVenta(input: VentaInput): Promise<Venta> {
  if (input.items.length === 0) {
    throw new Error("Agrega al menos un producto a la venta.");
  }
  const data = await apiFetch<VentaApi>("/ventas", { method: "POST", body: JSON.stringify(input) });
  return toVenta(data);
}

export async function anularVenta(id_venta: number): Promise<Venta> {
  const data = await apiFetch<VentaApi>(`/ventas/${id_venta}/anular`, { method: "POST" });
  return toVenta(data);
}
