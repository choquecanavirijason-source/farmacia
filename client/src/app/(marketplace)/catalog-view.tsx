"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageX, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/marketplace/product-card";
import { getProducts, getCategories } from "@/lib/api/marketplace";
import type { IProduct, IProductCategory } from "@/lib/types/marketplace";

const PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "name_asc", label: "Nombre (A-Z)", sortBy: "name", sortDir: "asc" as const },
  { value: "name_desc", label: "Nombre (Z-A)", sortBy: "name", sortDir: "desc" as const },
  { value: "price_asc", label: "Precio: menor a mayor", sortBy: "price", sortDir: "asc" as const },
  { value: "price_desc", label: "Precio: mayor a menor", sortBy: "price", sortDir: "desc" as const },
];

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: PER_PAGE }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CatalogView() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";

  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Cambiar de busqueda, categoria u orden vuelve siempre a la pagina 1.
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, sortValue]);

  const loadProducts = useCallback(() => {
    const sort = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];
    setLoading(true);
    setErrorMsg(null);
    getProducts({
      page,
      per_page: PER_PAGE,
      search: search || undefined,
      category_id: categoryId ?? undefined,
      sort_by: sort.sortBy,
      sort_dir: sort.sortDir,
    })
      .then((res) => {
        setProducts(res.data);
        setLastPage(res.meta.last_page);
        setTotal(res.meta.total);
      })
      .catch(() => setErrorMsg("No se pudo cargar el catálogo. Intenta de nuevo."))
      .finally(() => setLoading(false));
  }, [page, search, categoryId, sortValue]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {search ? `Resultados para "${search}"` : "Nuestros productos"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Buscando..." : `${total} producto${total === 1 ? "" : "s"} disponible${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select
          value={categoryId === null ? "all" : String(categoryId)}
          onValueChange={(v) => setCategoryId(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Categoría">
              {categoryId === null
                ? "Todas las categorías"
                : (categories.find((c) => c.id === categoryId)?.name ?? "Categoría")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortValue} onValueChange={(v) => v && setSortValue(v)}>
          <SelectTrigger className="w-full gap-1.5 sm:w-56">
            <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
            <SelectValue placeholder="Ordenar por">
              {SORT_OPTIONS.find((o) => o.value === sortValue)?.label ?? "Ordenar por"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : errorMsg ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <PackageX className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="text-muted-foreground">{errorMsg}</p>
          <Button variant="outline" onClick={loadProducts}>
            Reintentar
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <PackageX className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="text-muted-foreground">No encontramos productos con esos filtros.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
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
