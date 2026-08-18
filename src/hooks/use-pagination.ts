import { useMemo, useState } from "react";

/**
 * Pagina un arreglo ya filtrado/ordenado. Si el arreglo se achica (ej. una
 * búsqueda nueva) y la página actual queda fuera de rango, se recorta sola
 * al máximo válido — sin depender de un efecto para "resetear" el estado.
 */
export function usePagination<T>(items: T[] | null, pageSize = 10) {
  const [page, setPage] = useState(1);

  const pageCount = items ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    if (!items) return null;
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    pageCount,
    pageItems,
    totalItems: items?.length ?? 0,
    pageSize,
  };
}
