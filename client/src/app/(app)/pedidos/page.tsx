"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type DataTableColumn,
  type ServerFetchParams,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getPaginated, getById } from "@/lib/api/orders";
import type { IStaffOrder, OrderStatus } from "@/lib/types/orders";
import { OrderDetailSheet } from "./order-detail-sheet";

const DEFAULT_PARAMS: ServerFetchParams = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
};

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

export default function PedidosPage() {
  const [params, setParams] = useState<ServerFetchParams>(DEFAULT_PARAMS);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [items, setItems] = useState<IStaffOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<IStaffOrder | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const paramsRef = useRef(params);
  const handleParamsChange = useCallback((next: ServerFetchParams) => {
    const searchChanged = paramsRef.current.search !== next.search;
    paramsRef.current = next;
    if (!searchChanged) setLoading(true);
    setParams(next);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    getPaginated({
      page: params.page,
      per_page: params.pageSize,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.message || err?.message || "Error al cargar los pedidos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, statusFilter, refreshKey]);

  async function openDetail(order: IStaffOrder) {
    setLoadingDetailId(order.id);
    try {
      // El listado no trae los productos del pedido (details), solo el
      // endpoint de detalle los incluye.
      const response = await getById(order.id);
      setSelectedOrder(response.data);
      setSheetOpen(true);
    } catch {
      toast.error("No se pudo cargar el detalle del pedido.");
    } finally {
      setLoadingDetailId(null);
    }
  }

  function handleUpdated(updated: IStaffOrder) {
    setItems((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrder(updated);
  }

  const columns: DataTableColumn<IStaffOrder>[] = [
    {
      key: "order_number",
      header: "N° de Pedido",
      accessor: (o) => o.order_number,
      width: 180,
      render: (_, o) => <span className="font-mono text-xs font-semibold">{o.order_number}</span>,
    },
    {
      key: "customer",
      header: "Cliente",
      accessor: (o) => o.customer?.name ?? "",
      width: 220,
      render: (_, o) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium">{o.customer?.name ?? "—"}</span>
          <span className="text-[11px] text-muted-foreground">{o.customer?.email}</span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      accessor: (o) => o.total,
      width: 110,
      render: (_, o) => <span className="font-mono text-xs font-bold">{formatCurrency(Number(o.total))}</span>,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (o) => o.status,
      width: 150,
      render: (_, o) => <Badge variant={STATUS_VARIANTS[o.status]}>{STATUS_LABELS[o.status]}</Badge>,
    },
    {
      key: "branch",
      header: "Sucursal",
      accessor: (o) => o.branch?.name ?? "",
      width: 150,
      render: (_, o) => <span className="text-xs text-muted-foreground">{o.branch?.name ?? "Sin asignar"}</span>,
    },
    {
      key: "created_at",
      header: "Fecha",
      accessor: (o) => o.created_at,
      width: 160,
      render: (_, o) => <span className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      accessor: () => "",
      width: 80,
      render: (_, o) => (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={loadingDetailId === o.id}
          onClick={() => openDetail(o)}
          aria-label="Ver detalle"
        >
          {loadingDetailId === o.id ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos del Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Revisa y gestiona los pedidos que hacen los clientes desde la tienda pública.
        </p>
      </div>

      <DataTable
        data={items}
        columns={columns}
        server={{
          params,
          onParamsChange: handleParamsChange,
          total,
          loading,
          error,
          onRetry: refresh,
        }}
        filtersSlot={
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="h-10 w-auto min-w-48 text-xs px-3">
              <SelectValue placeholder="Estado">
                {statusFilter === "all" ? "Todos los estados" : STATUS_LABELS[statusFilter as OrderStatus]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        searchPlaceholder="Buscar por número, cliente o teléfono…"
        emptyMessage="No hay pedidos con esos filtros."
        pageSizeOptions={[10, 20, 50]}
        onRefresh={refresh}
        getRowId={(o) => o.id}
      />

      <OrderDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        order={selectedOrder}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
