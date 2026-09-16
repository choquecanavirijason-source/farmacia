"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Minus, Pill, Plus, ShieldAlert, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NumericInput } from "@/components/ui/numeric-input";
import { useCart } from "@/context/cart-context";
import { getProduct } from "@/lib/api/marketplace";
import type { IProduct } from "@/lib/types/marketplace";

export function ProductDetailView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { addItem } = useCart();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    getProduct(Number(id))
      .then((res) => setProduct(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function clampQuantity(value: number): number {
    if (!product) return 1;
    return Math.max(1, Math.min(value, product.total_stock));
  }

  function handleAdd() {
    if (!product) return;
    const qty = clampQuantity(Number(quantity) || 1);
    addItem(
      {
        medicament_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        max_stock: product.total_stock,
      },
      qty
    );
    toast.success(`${qty} x ${product.name} agregado al carrito.`, {
      id: "cart-toast",
      position: "bottom-right",
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <Pill className="size-10 text-muted-foreground/50" aria-hidden />
        <h1 className="text-lg font-semibold text-foreground">Producto no encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Puede que ya no esté disponible o el enlace sea incorrecto.
        </p>
        <Button nativeButton={false} render={<Link href="/" />} variant="outline" className="mt-2 gap-2">
          <ArrowLeft className="size-4" aria-hidden />
          Volver al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al catálogo
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted/40">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="size-full object-cover" />
          ) : (
            <Pill className="size-16 text-muted-foreground/40" aria-hidden />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Badge variant="outline">{product.category.name}</Badge>}
            {product.laboratory && <Badge variant="outline">{product.laboratory.name}</Badge>}
            {product.requires_prescription && (
              <Badge variant="warning" className="gap-1">
                <ShieldAlert className="size-3" aria-hidden />
                Requiere receta
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{product.name}</h1>
          {product.concentration && (
            <p className="text-sm text-muted-foreground">{product.concentration}</p>
          )}
          {product.presentation && (
            <p className="text-sm text-muted-foreground">Presentación: {product.presentation.name}</p>
          )}

          <p className="text-3xl font-bold tracking-tight text-foreground">
            Bs {Number(product.price).toFixed(2)}
          </p>

          {product.in_stock ? (
            <p className="text-sm font-medium text-success">
              En stock ({product.total_stock} disponibles)
            </p>
          ) : (
            <p className="text-sm font-medium text-destructive">Agotado por el momento</p>
          )}

          {product.in_stock && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setQuantity(String(clampQuantity(Number(quantity) - 1)))}
                  aria-label="Restar"
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <NumericInput
                  value={quantity}
                  onValueChange={(v) => setQuantity(v === "" ? "1" : String(clampQuantity(Number(v))))}
                  className="h-8 w-14 rounded-none border-x-0 text-center"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setQuantity(String(clampQuantity(Number(quantity) + 1)))}
                  aria-label="Sumar"
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>

              <Button onClick={handleAdd} className="gap-2">
                <ShoppingCart className="size-4" aria-hidden />
                Agregar al carrito
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
