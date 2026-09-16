"use client";

import Link from "next/link";
import { Pill, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import type { IProduct } from "@/lib/types/marketplace";

export function ProductCard({ product }: { product: IProduct }) {
  const { addItem } = useCart();

  function handleAdd() {
    addItem(
      {
        medicament_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        max_stock: product.total_stock,
      },
      1
    );
    toast.success(`${product.name} agregado al carrito.`);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)]">
      <Link
        href={`/productos/${product.id}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/40"
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Pill className="size-10 text-muted-foreground/40" aria-hidden />
        )}

        {product.requires_prescription && (
          <Badge variant="warning" className="absolute top-2 left-2 gap-1">
            <ShieldAlert className="size-3" aria-hidden />
            Receta
          </Badge>
        )}
        {!product.in_stock && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Agotado
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {product.category && (
          <span className="text-xs font-medium text-muted-foreground">{product.category.name}</span>
        )}
        <Link
          href={`/productos/${product.id}`}
          className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        {product.concentration && (
          <span className="text-xs text-muted-foreground">{product.concentration}</span>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold tracking-tight text-foreground">
            Bs {Number(product.price).toFixed(2)}
          </span>
          <Button
            size="icon-sm"
            disabled={!product.in_stock}
            onClick={handleAdd}
            aria-label="Agregar al carrito"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
