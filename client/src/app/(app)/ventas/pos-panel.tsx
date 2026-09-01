"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Minus,
  Pill,
  Plus,
  ScanLine,
  Search,
  ShoppingBasket,
  Trash2,
  UserPlus,
} from "lucide-react";
import { MedicamentFormDialog } from "@/app/(app)/medicamentos/medicament-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchClientes } from "@/lib/api/clients";
import { fetchLotes } from "@/lib/api/batches";
import { fetchMedicamentos } from "@/lib/api/medicaments";
import { crearVenta } from "@/lib/api/sales";
import { ApiError } from "@/lib/api/api-error";
import { formatCurrency } from "@/lib/format";
import {
  FORMAS_PAGO,
  type Categoria,
  type Cliente,
  type PaymentMethodName as FormaPagoNombre,
  type Laboratorio,
  type Lote,
  type Medicamento,
  type Presentacion,
  type Venta,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { InvoiceSheet } from "@/app/(app)/ventas/invoice-sheet";

interface PosPanelProps {
  idUsuario: number;
  idCaja: number;
  onVentaRegistrada: (venta: Venta) => void;
}

interface CartLine {
  id_medicamento: number;
  cantidad: number;
  /** Descuento por línea, 0-100. Se aplica sobre el precio de catálogo del medicamento. */
  descuentoPct: number;
}

function precioConDescuento(precioVenta: number, descuentoPct: number): number {
  return Math.round(precioVenta * (1 - descuentoPct / 100) * 100) / 100;
}

export function PosPanel({ idUsuario, idCaja, onVentaRegistrada }: PosPanelProps) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [idCliente, setIdCliente] = useState("1");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [facturaVenta, setFacturaVenta] = useState<Venta | null>(null);
  const [nuevoProductoOpen, setNuevoProductoOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetchMedicamentos(),
      fetchLotes(),
      fetchClientes(),
    ]).then(([m, l, c]) => {
      setMedicamentos(m);
      setLotes(l);
      setClientes(c);
    });
  }, []);

  function handleNuevoProducto(medicamento: Medicamento) {
    setMedicamentos((prev) => [...prev, medicamento]);
    toast.success("Medicamento creado. Registra un lote (Compras o Lotes) para poder venderlo.");
  }

  const stockPorMedicamento = useMemo(() => {
    const map = new Map<number, number>();
    for (const l of lotes) {
      map.set(l.id_medicamento, (map.get(l.id_medicamento) ?? 0) + l.cantidad_actual);
    }
    return map;
  }, [lotes]);

  const resultados = useMemo(() => {
    const query = search.trim().toLowerCase();
    const activos = medicamentos.filter((m) => m.estado === "activo");
    if (!query) return activos.slice(0, 12);
    return activos.filter(
      (m) => m.nombre.toLowerCase().includes(query) || m.codigo.toLowerCase().includes(query)
    );
  }, [medicamentos, search]);

  const medicamentoById = useMemo(
    () => new Map(medicamentos.map((m) => [m.id_medicamento, m])),
    [medicamentos]
  );

  const total = cart.reduce((sum, line) => {
    const m = medicamentoById.get(line.id_medicamento);
    return sum + (m ? precioConDescuento(m.precio_venta, line.descuentoPct) * line.cantidad : 0);
  }, 0);

  function addToCart(medicamento: Medicamento) {
    const disponible = stockPorMedicamento.get(medicamento.id_medicamento) ?? 0;
    if (disponible <= 0) {
      toast.error("Sin stock disponible.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.id_medicamento === medicamento.id_medicamento);
      if (existing) {
        if (existing.cantidad >= disponible) {
          toast.error(`Solo hay ${disponible} unidades disponibles.`);
          return prev;
        }
        return prev.map((l) =>
          l.id_medicamento === medicamento.id_medicamento ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [...prev, { id_medicamento: medicamento.id_medicamento, cantidad: 1, descuentoPct: 0 }];
    });
  }

  function updateCantidad(id_medicamento: number, delta: number) {
    const disponible = stockPorMedicamento.get(id_medicamento) ?? 0;
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.id_medicamento !== id_medicamento) return l;
          const next = l.cantidad + delta;
          if (next > disponible) {
            toast.error(`Solo hay ${disponible} unidades disponibles.`);
            return l;
          }
          return { ...l, cantidad: next };
        })
        .filter((l) => l.cantidad > 0)
    );
  }

  /** Cantidad tecleada directamente (además de los botones +/-) — para cargar cantidades altas rápido. */
  function setCantidad(id_medicamento: number, cantidad: number) {
    const disponible = stockPorMedicamento.get(id_medicamento) ?? 0;
    if (!Number.isFinite(cantidad) || cantidad < 1) return;
    if (cantidad > disponible) {
      toast.error(`Solo hay ${disponible} unidades disponibles.`);
      cantidad = disponible;
    }
    setCart((prev) => prev.map((l) => (l.id_medicamento === id_medicamento ? { ...l, cantidad } : l)));
  }

  function setDescuento(id_medicamento: number, descuentoPct: number) {
    const clamped = Math.min(100, Math.max(0, Number.isFinite(descuentoPct) ? descuentoPct : 0));
    setCart((prev) =>
      prev.map((l) => (l.id_medicamento === id_medicamento ? { ...l, descuentoPct: clamped } : l))
    );
  }

  function removeLine(id_medicamento: number) {
    setCart((prev) => prev.filter((l) => l.id_medicamento !== id_medicamento));
  }

  function handleScanClick() {
    searchInputRef.current?.focus();
    toast.info("El escaneo por código de barras estará disponible al conectar un lector.");
  }

  function handleSold(venta: Venta) {
    setCart([]);
    setIdCliente("1");
    onVentaRegistrada(venta);
    // Espera a que el diálogo de checkout termine su animación de cierre antes
    // de abrir la factura — evita que ambos pop-ups se crucen (fade-out y
    // fade-in superpuestos se ven como un salto, no como una transición).
    window.setTimeout(() => setFacturaVenta(venta), 180);
    // refresca stock local para reflejar el descuento sin recargar la página
    fetchLotes().then(setLotes);
  }

  const cliente = clientes.find((c) => c.id_cliente === Number(idCliente));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos…"
              className="pl-8"
              aria-label="Buscar productos"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleScanClick}
            aria-label="Escanear código de barras"
            title="Escanear código de barras"
          >
            <ScanLine className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {resultados.map((m) => {
            const disponible = stockPorMedicamento.get(m.id_medicamento) ?? 0;
            const sinStock = disponible <= 0;
            return (
              <button
                key={m.id_medicamento}
                type="button"
                onClick={() => addToCart(m)}
                disabled={sinStock}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background p-3 text-center transition-colors duration-200 ease-in-out hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Pill className="size-5" aria-hidden />
                </span>
                <span className="line-clamp-2 text-xs font-medium text-balance">{m.nombre}</span>
                <span className="text-xs font-semibold">{formatCurrency(m.precio_venta)}</span>
                {m.requiere_receta ? (
                  <Badge variant="outline" className="text-[10px]">
                    Receta
                  </Badge>
                ) : sinStock ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Sin stock
                  </Badge>
                ) : null}
              </button>
            );
          })}
          {resultados.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No encontramos productos para “{search}”.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setNuevoProductoOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background p-3 text-center transition-colors duration-200 ease-in-out hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Plus className="size-5" aria-hidden />
            </span>
            <span className="text-xs font-medium text-muted-foreground">Nuevo producto</span>
          </button>
        </div>
      </div>

      <Card className="flex h-fit flex-col gap-0 overflow-hidden lg:sticky lg:top-20">
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchableSelect
                options={clientes.map((c) => ({
                  value: String(c.id_cliente),
                  label: c.nombre,
                  sublabel: c.nit || c.ci ? `CI/NIT: ${c.nit || c.ci}` : undefined,
                }))}
                value={idCliente}
                onValueChange={(v) => setIdCliente(v || "1")}
                placeholder="Seleccionar cliente…"
                searchPlaceholder="Buscar por nombre o CI/NIT…"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ir a Gestión de Clientes"
              nativeButton={false}
              render={<a href="/clientes" />}
            >
              <UserPlus className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <ShoppingBasket className="size-8 text-muted-foreground" aria-hidden />
                <p className="max-w-48 text-xs text-balance text-muted-foreground">
                  Aquí verás los productos que elijas en tu próxima venta
                </p>
              </div>
            ) : (
              cart.map((line) => {
                const m = medicamentoById.get(line.id_medicamento);
                if (!m) return null;
                const precioFinal = precioConDescuento(m.precio_venta, line.descuentoPct);
                return (
                  <div key={line.id_medicamento} className="flex flex-col gap-2 rounded-lg border border-border/60 p-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={m.nombre}>
                          {m.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(m.precio_venta)} c/u
                          {line.descuentoPct > 0 ? (
                            <span className="text-warning"> · -{line.descuentoPct}% = {formatCurrency(precioFinal)}</span>
                          ) : null}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.id_medicamento)}
                        aria-label={`Quitar ${m.nombre} de la venta`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateCantidad(line.id_medicamento, -1)}
                          aria-label="Quitar una unidad"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </Button>
                        <NumericInput
                          value={String(line.cantidad)}
                          onValueChange={(v) => setCantidad(line.id_medicamento, Number(v || 0))}
                          maxDigits={5}
                          className="h-7 w-14 px-1 text-center"
                          aria-label={`Cantidad de ${m.nombre}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateCantidad(line.id_medicamento, 1)}
                          aria-label="Agregar una unidad"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </Button>
                      </div>

                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <NumericInput
                          value={String(line.descuentoPct)}
                          onValueChange={(v) => setDescuento(line.id_medicamento, Number(v || 0))}
                          maxDigits={3}
                          className="h-7 w-14 px-1 text-center"
                          aria-label={`Descuento de ${m.nombre}`}
                        />
                        <span className="text-xs text-muted-foreground">% desc.</span>
                      </div>

                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatCurrency(precioFinal * line.cantidad)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>

        <div className="mt-auto flex flex-col gap-2 border-t border-border/60 bg-muted/40 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{cart.length} producto(s)</span>
            {cart.length > 0 ? (
              <button type="button" onClick={() => setCart([])} className="underline-offset-2 hover:underline">
                Cancelar
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full justify-between"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <span>Vender</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </Button>
        </div>
      </Card>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        total={total}
        cliente={cliente}
        idUsuario={idUsuario}
        idCaja={idCaja}
        medicamentos={medicamentos}
        onSold={handleSold}
      />

      <InvoiceSheet
        sale={facturaVenta}
        open={Boolean(facturaVenta)}
        onOpenChange={(open) => !open && setFacturaVenta(null)}
      />

      <MedicamentFormDialog
        open={nuevoProductoOpen}
        onOpenChange={setNuevoProductoOpen}
        onSaved={handleNuevoProducto}
      />
    </div>
  );
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartLine[];
  total: number;
  cliente: Cliente | undefined;
  idUsuario: number;
  idCaja: number;
  medicamentos: Medicamento[];
  onSold: (venta: Venta) => void;
}

function CheckoutBody({
  onOpenChange,
  onDirtyChange,
  cart,
  total,
  cliente,
  idUsuario,
  idCaja,
  medicamentos,
  onSold,
}: Omit<CheckoutDialogProps, "open"> & { onDirtyChange: (dirty: boolean) => void }) {
  const [formaPago, setFormaPago] = useState<FormaPagoNombre>("Efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onDirtyChange(montoRecibido !== "");
  }, [montoRecibido, onDirtyChange]);

  const valorRecibido = Number(montoRecibido);
  const vuelto =
    formaPago === "Efectivo" && montoRecibido !== "" && Number.isFinite(valorRecibido)
      ? valorRecibido - total
      : null;

  async function handleConfirm() {
    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }
    if (formaPago === "Efectivo" && (!Number.isFinite(valorRecibido) || valorRecibido < total)) {
      setError("El monto recibido debe cubrir el total de la venta.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const precioById = new Map(medicamentos.map((m) => [m.id_medicamento || m.id, m.precio_venta || Number(m.price)]));
      const venta = await crearVenta({
        id_cliente: cliente.id_cliente,
        id_usuario: idUsuario,
        id_caja: idCaja,
        forma_pago: formaPago,
        nit_cliente: cliente.nit || cliente.ci || "0",
        razon_social: cliente.nombre,
        items: cart.map((l) => ({
          id_medicamento: l.id_medicamento,
          cantidad: l.cantidad,
          precio_unitario: precioConDescuento(precioById.get(l.id_medicamento) ?? 0, l.descuentoPct),
        })),
      });
      onSold(venta as any as Venta);
      onOpenChange(false);
      toast.success("Venta registrada.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <DialogHeader className="pb-2 border-b">
        <DialogTitle className="text-lg font-semibold">Confirmar Venta</DialogTitle>
        <DialogDescription className="text-xs">
          Cliente: <span className="font-medium text-foreground">{cliente?.nombre ?? "Cliente General"}</span>
          {cliente?.ci || cliente?.nit ? ` (NIT/CI: ${cliente.nit || cliente.ci})` : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto py-3 pr-1 flex flex-col gap-4 min-h-0">
        {/* Resumen de Productos */}
        <div className="flex flex-col rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
          <div className="px-3 py-2 bg-muted/40 border-b text-xs font-semibold text-muted-foreground flex justify-between">
            <span>Productos ({cart.reduce((a, b) => a + b.cantidad, 0)})</span>
            <span>Subtotal</span>
          </div>
          <div className="max-h-36 sm:max-h-44 overflow-y-auto p-2.5 flex flex-col gap-2">
            {cart.map((line) => {
              const m = medicamentos.find((med) => med.id_medicamento === line.id_medicamento);
              const precioFinal = precioConDescuento(m?.precio_venta ?? 0, line.descuentoPct);
              return (
                <div key={line.id_medicamento} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground" title={m?.nombre}>
                      {m?.nombre ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {line.cantidad} × {formatCurrency(precioFinal)}
                      {line.descuentoPct > 0 ? ` (-${line.descuentoPct}%)` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold font-mono text-xs tabular-nums">
                    {formatCurrency(precioFinal * line.cantidad)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-3 py-2.5 bg-primary/5 border-t border-border/60 flex items-center justify-between">
            <span className="text-sm font-bold">Total a Cobrar:</span>
            <span className="text-base font-bold font-mono text-primary tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="forma_pago" className="text-xs font-medium">Forma de Pago</Label>
          <Select value={formaPago} onValueChange={(v) => setFormaPago((v as FormaPagoNombre) ?? "Efectivo")} disabled={saving}>
            <SelectTrigger id="forma_pago" className="w-full h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAS_PAGO.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pago en Efectivo & Cálculo de Cambio */}
        {formaPago === "Efectivo" ? (
          <div className="flex flex-col gap-2 rounded-lg border p-3 bg-background">
            <div className="flex items-center justify-between">
              <Label htmlFor="monto_recibido" className="text-xs font-medium">Monto recibido (Bs)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-primary"
                onClick={() => setMontoRecibido(String(total))}
              >
                Monto Exacto
              </Button>
            </div>
            <NumericInput
              id="monto_recibido"
              allowDecimal
              value={montoRecibido}
              onValueChange={setMontoRecibido}
              disabled={saving}
              className="h-9 font-mono text-sm"
              placeholder={`Ej. ${total}`}
              autoFocus
            />

            {/* Botones de billetes rápidos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10, 20, 50, 100, 200].filter(b => b >= total || b === 10).map((billete) => (
                <Button
                  key={billete}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
                  onClick={() => setMontoRecibido(String(billete))}
                >
                  Bs {billete}
                </Button>
              ))}
            </div>

            {vuelto !== null ? (
              <div className={cn(
                "mt-1 rounded-md px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between",
                vuelto < 0 ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-success/10 text-success border border-success/20"
              )}>
                <span>{vuelto < 0 ? "Faltante:" : "Cambio / Vuelto:"}</span>
                <span className="font-mono text-sm">
                  {vuelto < 0 ? formatCurrency(Math.abs(vuelto)) : formatCurrency(vuelto)}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter className="pt-3 border-t mt-auto flex flex-row items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="button" size="sm" disabled={saving} onClick={handleConfirm} className="gap-1.5">
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Procesando…
            </>
          ) : (
            "Completar Venta"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

function CheckoutDialog({ open, onOpenChange, ...bodyProps }: CheckoutDialogProps) {
  const [dirty, setDirty] = useState(false);

  function handleDialogOpenChange(next: boolean) {
    if (!next && dirty) {
      if (!window.confirm("Vas a perder el monto recibido que escribiste. ¿Cerrar de todas formas?")) {
        return;
      }
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        {open ? (
          <CheckoutBody key="checkout" onOpenChange={onOpenChange} onDirtyChange={setDirty} {...bodyProps} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
