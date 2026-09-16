"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CircleCheck, Loader2, PackageCheck, Trash2, XCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { updateStatus, removeDetail, getBranchAvailability } from "@/lib/api/orders";
import type { IBranchAvailability, IStaffOrder, OrderStatus } from "@/lib/types/orders";

interface OrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: IStaffOrder | null;
  onUpdated: (order: IStaffOrder) => void;
}

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

export function OrderDetailSheet({ open, onOpenChange, order, onUpdated }: OrderDetailSheetProps) {
  const [branches, setBranches] = useState<IBranchAvailability[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [submitting, setSubmitting] = useState<OrderStatus | null>(null);
  const [removingDetailId, setRemovingDetailId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !order || order.status !== "pending") return;
    setLoadingBranches(true);
    getBranchAvailability(order.id)
      .then((res) => setBranches(res.data))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
    setSelectedBranchId("");
    // Se vuelve a pedir si se quita un producto (cambia lo que hace falta por sucursal).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id, order?.status, order?.details.length]);

  if (!order) return null;

  async function handleTransition(status: OrderStatus, branchId?: number) {
    setSubmitting(status);
    try {
      const response = await updateStatus(order!.id, status, branchId);
      onUpdated(response.data);
      toast.success("Estado del pedido actualizado.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.branch_id?.[0] ||
          err?.response?.data?.errors?.items?.[0] ||
          err?.response?.data?.message ||
          "No se pudo actualizar el pedido."
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRemoveDetail(detailId: number) {
    setRemovingDetailId(detailId);
    try {
      const response = await removeDetail(order!.id, detailId);
      onUpdated(response.data);
      toast.success(
        response.data.status === "cancelled"
          ? "Producto quitado. El pedido se canceló porque no quedaron productos."
          : "Producto quitado del pedido."
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "No se pudo quitar el producto.");
    } finally {
      setRemovingDetailId(null);
    }
  }

  const canEditItems = order.status !== "completed" && order.status !== "cancelled";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-mono">{order.order_number}</SheetTitle>
          <SheetDescription>
            Pedido de {order.customer?.name ?? "cliente"} · {formatDateTime(order.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex items-center justify-between">
            <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
            <span className="text-lg font-bold">{formatCurrency(Number(order.total))}</span>
          </div>

          <Separator />

          <div className="flex flex-col gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Contacto: </span>
              {order.contact_name} · {order.contact_phone}
            </p>
            {order.branch && (
              <p>
                <span className="text-muted-foreground">Sucursal: </span>
                {order.branch.name}
              </p>
            )}
            {order.notes && (
              <p>
                <span className="text-muted-foreground">Notas: </span>
                {order.notes}
              </p>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Productos</p>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {order.details.map((detail) => (
                <li key={detail.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {detail.quantity} x {detail.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium">{formatCurrency(Number(detail.subtotal))}</span>
                    {canEditItems && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={removingDetailId !== null}
                        onClick={() => handleRemoveDetail(detail.id)}
                        aria-label={`Quitar ${detail.name}`}
                        title="Quitar (ej. no trajo la receta)"
                      >
                        {removingDetailId === detail.id ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden />
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
              {order.details.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">Sin productos.</li>
              )}
            </ul>
          </div>

          <Separator />

          {order.status === "pending" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Confirmar y elegir sucursal</p>
              <Select value={selectedBranchId} onValueChange={(v) => v && setSelectedBranchId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingBranches ? "Revisando stock…" : "Elegir sucursal"}>
                    {branches.find((b) => String(b.id) === selectedBranchId)?.name ??
                      (loadingBranches ? "Revisando stock…" : "Elegir sucursal")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      <span className="flex w-full items-center justify-between gap-2">
                        <span>{branch.name}</span>
                        {branch.can_fulfill ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CircleCheck className="size-3.5" aria-hidden />
                            Tiene todo
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 text-xs text-warning"
                            title={branch.missing.map((m) => `${m.name} (disp. ${m.available}/${m.needed})`).join(", ")}
                          >
                            <AlertTriangle className="size-3.5" aria-hidden />
                            Falta{branch.missing.length > 1 ? "n" : ""} {branch.missing.length}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1.5"
                  disabled={!selectedBranchId || submitting !== null}
                  onClick={() => handleTransition("confirmed", Number(selectedBranchId))}
                >
                  {submitting === "confirmed" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-4" aria-hidden />
                  )}
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  disabled={submitting !== null}
                  onClick={() => handleTransition("cancelled")}
                >
                  <XCircle className="size-4" aria-hidden />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {order.status === "confirmed" && (
            <div className="flex gap-2">
              <Button className="flex-1 gap-1.5" disabled={submitting !== null} onClick={() => handleTransition("ready")}>
                {submitting === "ready" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <PackageCheck className="size-4" aria-hidden />
                )}
                Marcar listo para recoger
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                disabled={submitting !== null}
                onClick={() => handleTransition("cancelled")}
              >
                <XCircle className="size-4" aria-hidden />
                Cancelar
              </Button>
            </div>
          )}

          {order.status === "ready" && (
            <div className="flex gap-2">
              <Button className="flex-1 gap-1.5" disabled={submitting !== null} onClick={() => handleTransition("completed")}>
                {submitting === "completed" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                Completar (entregado)
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                disabled={submitting !== null}
                onClick={() => handleTransition("cancelled")}
              >
                <XCircle className="size-4" aria-hidden />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
