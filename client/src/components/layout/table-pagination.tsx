import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Si se pasa junto con onPageSizeChange, muestra un selector de filas por página. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}

/** Controles de paginación compactos para debajo de una tabla. Se oculta sola si no hay filas. */
export function TablePagination({
  page,
  pageCount,
  pageSize,
  totalItems,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-3">
        <p>
          {start}–{end} de {totalItems}
        </p>
        {pageSizeOptions && onPageSizeChange ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Filas por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => v && onPageSizeChange(Number(v))}>
              <SelectTrigger size="sm" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-16 text-center text-xs tabular-nums">
            {page} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
