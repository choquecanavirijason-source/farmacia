import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  siblingCount?: number;
}

function getPageRange(page: number, pageCount: number, siblingCount: number = 1): (number | string)[] {
  const totalNumbers = siblingCount * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (pageCount <= totalBlocks) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1);
  const rightSiblingIndex = Math.min(page + siblingCount, pageCount);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < pageCount - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, "…", pageCount];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => pageCount - (2 + siblingCount * 2) + i + 1
    );
    return [1, "…", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, "…", ...middleRange, "…", pageCount];
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  totalItems,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  siblingCount = 1,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pageRange = getPageRange(page, pageCount, siblingCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          {start}–{end} de <span className="font-medium text-foreground">{totalItems}</span>
        </p>
        {pageSizeOptions && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Filas por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => v && onPageSizeChange(Number(v))}>
              <SelectTrigger size="sm" className="w-16 h-8">
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
        )}
      </div>
      {pageCount >= 1 && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="Primera página"
            className="h-8 w-8 rounded-full"
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>

          <div className="flex items-center gap-0.5 mx-1">
            {pageRange.map((item, index) => {
              if (item === "…") {
                return (
                  <span key={`dots-${index}`} className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
                    …
                  </span>
                );
              }
              const pageNum = item as number;
              const isActive = pageNum === page;
              return (
                <Button
                  key={pageNum}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Ir a página ${pageNum}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label="Última página"
            className="h-8 w-8 rounded-full"
          >
            <ChevronsRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}