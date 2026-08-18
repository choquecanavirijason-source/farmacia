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
import { fetchCategorias, fetchLaboratorios, fetchPresentaciones } from "@/lib/api/catalogos";
import { MedicamentoFormDialog } from "@/app/(app)/medicamentos/medicamento-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchClientes } from "@/lib/api/clientes";
import { fetchLotes } from "@/lib/api/lotes";
import { fetchMedicamentos } from "@/lib/api/medicamentos";
import { crearVenta } from "@/lib/api/ventas";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import {
  FORMAS_PAGO,
  type Categoria,
  type Cliente,
  type FormaPagoNombre,
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
import { FacturaSheet } from "@/app/(app)/ventas/factura-sheet";

interface PosPanelProps {
  idUsuario: number;
  idCaja: number;
  onVentaRegistrada: (venta: Venta) => void;
}

interface CartLine {
  id_medicamento: number;
  cantidad: number;
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
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [nuevoProductoOpen, setNuevoProductoOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetchMedicamentos(),
      fetchLotes(),
      fetchClientes(),
      fetchCategorias(),
      fetchPresentaciones(),
      fetchLaboratorios(),
    ]).then(([m, l, c, cat, pres, lab]) => {
      setMedicamentos(m);
      setLotes(l);
      setClientes(c);
      setCategorias(cat);
      setPresentaciones(pres);
      setLaboratorios(lab);
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
    return sum + (m ? m.precio_venta * line.cantidad : 0);
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
      return [...prev, { id_medicamento: medicamento.id_medicamento, cantidad: 1 }];
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
    setFacturaVenta(venta);
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
              <Select value={idCliente} onValueChange={(v) => setIdCliente(v ?? "1")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id_cliente} value={String(c.id_cliente)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ir a Gestión de Clientes"
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
                return (
                  <div key={line.id_medicamento} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={m.nombre}>
                        {m.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(m.precio_venta)} c/u</p>
                    </div>
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
                      <span className="w-6 text-center text-sm tabular-nums">{line.cantidad}</span>
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
        onSold={handleSold}
      />

      <FacturaSheet
        venta={facturaVenta}
        medicamentos={medicamentos}
        onOpenChange={(open) => !open && setFacturaVenta(null)}
      />

      <MedicamentoFormDialog
        open={nuevoProductoOpen}
        onOpenChange={setNuevoProductoOpen}
        categorias={categorias}
        presentaciones={presentaciones}
        laboratorios={laboratorios}
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
  onSold: (venta: Venta) => void;
}

function CheckoutBody({
  onOpenChange,
  cart,
  total,
  cliente,
  idUsuario,
  idCaja,
  onSold,
}: Omit<CheckoutDialogProps, "open">) {
  const [formaPago, setFormaPago] = useState<FormaPagoNombre>("Efectivo");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const medicamentos = await fetchMedicamentos();
      const precioById = new Map(medicamentos.map((m) => [m.id_medicamento, m.precio_venta]));
      const venta = await crearVenta({
        id_cliente: cliente.id_cliente,
        id_usuario: idUsuario,
        id_caja: idCaja,
        forma_pago: formaPago,
        nit_cliente: cliente.ci_nit,
        razon_social: cliente.nombre,
        items: cart.map((l) => ({
          id_medicamento: l.id_medicamento,
          cantidad: l.cantidad,
          precio_unitario: precioById.get(l.id_medicamento) ?? 0,
        })),
      });
      onSold(venta);
      onOpenChange(false);
      toast.success("Venta registrada.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirmar venta</DialogTitle>
        <DialogDescription>
          Cliente: {cliente?.nombre ?? "—"} — Total: <strong>{formatCurrency(total)}</strong>
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="forma_pago">Forma de pago</Label>
          <Select value={formaPago} onValueChange={(v) => setFormaPago((v as FormaPagoNombre) ?? "Efectivo")} disabled={saving}>
            <SelectTrigger id="forma_pago" className="w-full">
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

        {error ? (
          <p role="alert" className="text-sm wrap-break-word text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" disabled={saving} onClick={handleConfirm}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Registrando…
            </>
          ) : (
            "Confirmar venta"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

function CheckoutDialog({ open, onOpenChange, ...bodyProps }: CheckoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open ? <CheckoutBody key="checkout" onOpenChange={onOpenChange} {...bodyProps} /> : null}
      </DialogContent>
    </Dialog>
  );
}
