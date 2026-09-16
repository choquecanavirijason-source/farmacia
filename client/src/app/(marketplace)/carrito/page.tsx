"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Pill, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <ShoppingBag className="size-10 text-muted-foreground/50" aria-hidden />
        <h1 className="text-lg font-semibold text-foreground">Tu carrito está vacío</h1>
        <p className="text-sm text-muted-foreground">Agregá productos del catálogo para empezar tu pedido.</p>
        <Button nativeButton={false} render={<Link href="/" />} className="mt-2 gap-2">
          <ArrowLeft className="size-4" aria-hidden />
          Ir al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tu carrito ({totalItems} {totalItems === 1 ? "producto" : "productos"})
        </h1>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearCart}>
          <Trash2 className="size-3.5" aria-hidden />
          Vaciar carrito
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card lg:col-span-2">
          {items.map((item) => (
            <div key={item.medicament_id} className="flex items-center gap-4 p-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/40">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.name} className="size-full object-cover" />
                ) : (
                  <Pill className="size-6 text-muted-foreground/40" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">Bs {item.price.toFixed(2)} c/u</p>
              </div>

              <div className="flex items-center rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-r-none"
                  onClick={() => updateQuantity(item.medicament_id, item.quantity - 1)}
                  aria-label="Restar"
                >
                  <Minus className="size-3.5" aria-hidden />
                </Button>
                <NumericInput
                  value={String(item.quantity)}
                  onValueChange={(v) => updateQuantity(item.medicament_id, v === "" ? 1 : Number(v))}
                  className="h-7 w-11 rounded-none border-x-0 text-center"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-l-none"
                  disabled={item.quantity >= item.max_stock}
                  onClick={() => updateQuantity(item.medicament_id, item.quantity + 1)}
                  aria-label="Sumar"
                >
                  <Plus className="size-3.5" aria-hidden />
                </Button>
              </div>

              <span className="w-20 shrink-0 text-right text-sm font-semibold text-foreground">
                Bs {(item.price * item.quantity).toFixed(2)}
              </span>

              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.medicament_id)}
                aria-label={`Quitar ${item.name}`}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-3xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Resumen del pedido</h2>
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>Bs {totalPrice.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            El pago se coordina al recoger o recibir tu pedido.
          </p>
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>Bs {totalPrice.toFixed(2)}</span>
          </div>

          <Button nativeButton={false} render={<Link href="/checkout" />} className="mt-4 w-full">
            Continuar con el pedido
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="ghost"
            className="mt-2 w-full gap-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Seguir comprando
          </Button>
        </div>
      </div>
    </div>
  );
}
