"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  PackageCheck,
  PackageSearch,
  PackageX,
  Pill,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { getMyOrders } from "@/lib/api/marketplace";
import { cn } from "@/lib/utils";
import type { IOrder, OrderStatus } from "@/lib/types/marketplace";

const PER_PAGE = 10;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  ready: "Listo para recoger",
  completed: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_VARIANTS: Record<OrderStatus, "secondary" | "default" | "warning" | "success" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  ready: "warning",
  completed: "success",
  cancelled: "destructive",
};

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pedido" },
  { key: "confirmed", label: "Confirmado" },
  { key: "ready", label: "Listo" },
  { key: "completed", label: "Entregado" },
];

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <PackageX className="size-4" aria-hidden />
        Pedido cancelado
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex w-full items-start">
      {STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className={cn("flex items-center", !isLast && "flex-1")}>
            {/* Ancho fijo (no depende del largo de la palabra) para que las columnas
                queden parejas y las lineas conectoras midan siempre lo mismo. */}
            <div className="flex w-10 shrink-0 flex-col items-center gap-1 sm:w-14">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                  reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-center text-[10px] leading-tight wrap-break-word sm:block",
                  reached ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn("h-0.5 flex-1 rounded-full", i < currentIndex ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: IOrder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-4 p-4 text-left sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">{order.order_number}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" aria-hidden />
                  {new Date(order.created_at).toLocaleDateString("es-BO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-lg font-bold text-foreground">Bs {Number(order.total).toFixed(2)}</span>
            <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <OrderProgress status={order.status} />
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5">
          <ul className="flex flex-col divide-y divide-border">
            {order.details.map((detail) => (
              <li key={detail.id} className="flex items-center gap-3 py-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">
                  {detail.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.image_url} alt={detail.name} className="size-full object-cover" />
                  ) : (
                    <Pill className="size-4 text-muted-foreground/40" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {detail.quantity} x {detail.name}
                </span>
                <span className="shrink-0 text-sm font-medium text-foreground">
                  Bs {Number(detail.subtotal).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          {(order.branch || order.notes) && (
            <>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {order.branch && (
                  <p className="flex items-center gap-1.5">
                    <PackageCheck className="size-3.5" aria-hidden />
                    Se prepara en: <span className="font-medium text-foreground">{order.branch.name}</span>
                  </p>
                )}
                {order.notes && <p>Notas: {order.notes}</p>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?next=/mis-pedidos");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    getMyOrders({ page, per_page: PER_PAGE })
      .then((res) => {
        setOrders(res.data);
        setLastPage(res.meta.last_page);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, page]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis pedidos</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              {total} pedido{total === 1 ? "" : "s"} en total
            </p>
          )}
        </div>
        <Button nativeButton={false} render={<Link href="/" />} variant="outline" size="sm" className="gap-1.5">
          <Pill className="size-3.5" aria-hidden />
          Seguir comprando
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <PackageSearch className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="text-muted-foreground">Todavía no hiciste ningún pedido.</p>
          <Button nativeButton={false} render={<Link href="/" />} className="mt-2 gap-2">
            <Pill className="size-4" aria-hidden />
            Ir al catálogo
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {lastPage}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
