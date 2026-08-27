import { useMemo, useState } from "react";

/**
 * Pagina un arreglo ya filtrado/ordenado. Si el arreglo se achica (ej. una
 * búsqueda nueva) y la página actual queda fuera de rango, se recorta sola
 * al máximo válido — sin depender de un efecto para "resetear" el estado.
 *
 * En modo servidor (`pageIsServer`), `items` ya es la página que devolvió la
 * API (no el total) y el total real llega por `totalOverride`.
 */
export function usePagination<T>(items: T[] | null, pageSize = 10, totalOverride?: number, pageIsServer = false) {
  const [page, setPage] = useState(1);

  const totalItems = totalOverride ?? items?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    if (!items) return null;
    if (pageIsServer) return items;
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize, pageIsServer]);

  return {
    page: safePage,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  };
}
