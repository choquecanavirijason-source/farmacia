import { apiFetch } from "@/lib/api/http";
import type {
  DetalleVenta,
  Factura,
  FormaPagoNombre,
  Venta,
} from "@/lib/types";

interface VentaApi {
  id: number;
  sold_at: string;
  total: string | number;
  status: "active" | "voided";
  client_id: number | null;
  user_id: number;
  cash_register_id: number;
  forma_pago?: string;
}

function toVenta(v: VentaApi): Venta {
  return {
    id_venta: v.id,
    fecha: v.sold_at,
    total: Number(v.total),
    estado: v.status === "active" ? "activa" : "anulada",
    id_cliente: v.client_id ?? 0,
    id_usuario: v.user_id,
    id_caja: v.cash_register_id,
    forma_pago: (v.forma_pago as FormaPagoNombre) ?? "Efectivo",
  };
}

interface DetalleVentaApi {
  id: number;
  sale_id: number;
  medicament_id: number;
  batch_id: number;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

function toDetalle(d: DetalleVentaApi): DetalleVenta {
  return {
    id_detalle_venta: d.id,
    id_venta: d.sale_id,
    id_medicamento: d.medicament_id,
    id_lote: d.batch_id,
    cantidad: d.quantity,
    precio_unitario: Number(d.unit_price),
    subtotal: Number(d.subtotal),
  };
}

interface FacturaApi {
  id: number;
  sale_id: number;
  invoice_number: string;
  client_tax_id: string;
  business_name: string;
  issued_at: string;
  total: string | number;
}

function toFactura(f: FacturaApi): Factura {
  return {
    id_factura: f.id,
    id_venta: f.sale_id,
    numero_factura: f.invoice_number,
    nit_cliente: f.client_tax_id,
    razon_social: f.business_name,
    fecha_emision: f.issued_at,
    total: Number(f.total),
  };
}

export async function fetchVentas(): Promise<Venta[]> {
  const response = await apiFetch<{ data: VentaApi[] }>("/sales?per_page=100");
  return response.data.map(toVenta);
}

export async function fetchDetallesByVenta(
  id_venta: number,
): Promise<DetalleVenta[]> {
  const data = await apiFetch<DetalleVentaApi[]>(
    `/sales/${id_venta}/details`,
  );
  return data.map(toDetalle);
}

export async function fetchFacturaByVenta(
  id_venta: number,
): Promise<Factura | null> {
  const data = await apiFetch<FacturaApi | null>(`/sales/${id_venta}/invoice`);
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
 * descuenta stock, genera kardex, factura, pago e ingreso en caja — todo
 * en una sola transacción (ver SaleController@store).
 */
export async function crearVenta(input: VentaInput): Promise<Venta> {
  if (input.items.length === 0) {
    throw new Error("Agrega al menos un producto a la venta.");
  }
  const response = await apiFetch<VentaApi>("/sales", {
    method: "POST",
    body: JSON.stringify({
      client_id: input.id_cliente,
      user_id: input.id_usuario,
      cash_register_id: input.id_caja,
      forma_pago: input.forma_pago,
      nit_cliente: input.nit_cliente,
      razon_social: input.razon_social,
      items: input.items.map((item) => ({
        medicament_id: item.id_medicamento,
        quantity: item.cantidad,
        unit_price: item.precio_unitario,
      })),
    }),
  });
  return toVenta(response);
}

export async function anularVenta(id_venta: number): Promise<Venta> {
  const response = await apiFetch<VentaApi>(`/sales/${id_venta}/void`, {
    method: "POST",
  });
  return toVenta(response);
}
