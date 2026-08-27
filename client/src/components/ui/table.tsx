"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search, X } from "lucide-react"
import { toast } from "sonner"

import { TablePagination } from "@/components/layout/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type DataTableValue = string | number | boolean | Date | null | undefined

export interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  accessor: keyof T | ((row: T) => DataTableValue)
  render?: (value: DataTableValue, row: T) => React.ReactNode
  sortable?: boolean
  /** Muestra un buscador propio de esta columna debajo del encabezado. Por defecto: true. */
  filterable?: boolean
  className?: string
  /** Habilita edición rápida: doble clic en la celda la convierte en input y guarda al confirmar. */
  edit?: {
    type?: "text" | "number"
    onSave: (row: T, value: string | number) => Promise<void>
  }
}

export interface ServerFetchParams {
  page: number
  pageSize: number
  search: string
  sort: { key: string; direction: "asc" | "desc" } | null
}

export interface ServerFetchResult<T> {
  items: T[]
  total: number
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  pageSize?: number
  pageSizeOptions?: number[]
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  /** Habilita la columna de checkboxes y la selección de filas. */
  getRowId?: (row: T) => string | number
  onSelectionChange?: (rows: T[]) => void
  /** Nombre del archivo al exportar a CSV. */
  exportFilename?: string
  /**
   * Activa el modo servidor: cada cambio de página, de pageSize o de búsqueda
   * (con debounce) llama a la API. El request anterior se cancela (AbortSignal).
   */
  fetchData?: (params: ServerFetchParams, signal: AbortSignal) => Promise<ServerFetchResult<T>>
  /** Al cambiar, fuerza un re-fetch (ej. tras crear/editar/eliminar un registro). */
  refreshKey?: unknown
  /** Al cambiar, limpia la selección de filas desde afuera (ej. tras eliminar en lote). */
  clearSelectionKey?: unknown
}

/** Columnas de solo-acciones (sin orden ni filtro): se fijan a la derecha y quedan fuera de reordenar/redimensionar/exportar. */
function isPinnedColumn<T>(column: DataTableColumn<T>) {
  return column.sortable === false && column.filterable === false
}

function getColumnValue<T>(row: T, column: DataTableColumn<T>) {
  return typeof column.accessor === "function"
    ? column.accessor(row)
    : (row[column.accessor] as DataTableValue)
}

function normalizeSearchValue(value: DataTableValue) {
  if (value instanceof Date) return value.toLocaleDateString()
  return String(value ?? "").toLocaleLowerCase()
}

function compareValues(left: DataTableValue, right: DataTableValue) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1

  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }

  return normalizeSearchValue(left).localeCompare(normalizeSearchValue(right), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function csvCell(value: DataTableValue) {
  const text = value instanceof Date ? value.toLocaleDateString() : String(value ?? "")
  return /["\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  searchPlaceholder = "Buscar en la tabla...",
  emptyMessage = "No se encontraron registros.",
  className,
  getRowId,
  onSelectionChange,
  exportFilename = "tabla.csv",
  fetchData,
  refreshKey,
  clearSelectionKey,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({})
  const [sort, setSort] = React.useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [currentPageSize, setCurrentPageSize] = React.useState(pageSize)
  const [colWidths, setColWidths] = React.useState<Record<string, number>>({})
  const [layoutFixed, setLayoutFixed] = React.useState(false)
  const [order, setOrder] = React.useState<string[]>(() => columns.map((c) => c.key))
  const [draggedKey, setDraggedKey] = React.useState<string | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set())
  const [editing, setEditing] = React.useState<{ index: number; key: string; value: string; saving: boolean } | null>(
    null
  )
  const theadRefs = React.useRef<Record<string, HTMLTableCellElement | null>>({})

  // --- Modo servidor: debounce del search + estado de la página traída de la API ---
  const isServerSide = Boolean(fetchData)
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [serverState, setServerState] = React.useState<ServerFetchResult<T>>({
    items: data,
    total: data.length
  })
  const [serverLoading, setServerLoading] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [retryKey, setRetryKey] = React.useState(0)
  const abortRef = React.useRef<AbortController | null>(null)
  const isFirstRender = React.useRef(true)
  const lastFetchKey = React.useRef("")
  const lastSelectionSignature = React.useRef<string | null>(null)
  // `fetchData` se recrea en cada render del padre; se guarda en un ref para que
  // su cambio de identidad NO dispare (ni aborte) el fetch en vuelo.
  const fetchDataRef = React.useRef(fetchData)
  fetchDataRef.current = fetchData

  // Debounce del search
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timer)
  }, [search])

  const selectable = Boolean(getRowId)

  // Resetear orden cuando cambian las columnas
  React.useEffect(() => {
    const keys = columns.map((c) => c.key)
    setOrder((prev) => (prev.length === keys.length && prev.every((k) => keys.includes(k)) ? prev : keys))
  }, [columns])

  const orderedColumns = React.useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]))
    const result = order.map((k) => byKey.get(k)).filter((c): c is DataTableColumn<T> => Boolean(c))
    return result.length === columns.length ? result : columns
  }, [order, columns])

  const hasActiveFilters =
    search.trim().length > 0 || Object.values(columnFilters).some((value) => value.trim().length > 0)

  function clearFilters() {
    setSearch("")
    setColumnFilters({})
  }

  const filteredData = React.useMemo(() => {
    const activeColumnFilters = columns
      .map((column) => ({ column, query: (columnFilters[column.key] ?? "").trim().toLocaleLowerCase() }))
      .filter((entry) => entry.query.length > 0)

    const rows = isServerSide ? serverState.items : data

    // En modo servidor la búsqueda global ya la hace la API; solo quedan los filtros de columna.
    if (isServerSide) {
      return activeColumnFilters.length === 0
        ? rows
        : rows.filter((row) =>
          activeColumnFilters.every(({ column, query: columnQuery }) =>
            normalizeSearchValue(getColumnValue(row, column)).includes(columnQuery)
          )
        )
    }

    const query = search.trim().toLocaleLowerCase()
    return rows.filter((row) => {
      if (query && !columns.some((column) => normalizeSearchValue(getColumnValue(row, column)).includes(query))) {
        return false
      }
      return activeColumnFilters.every(({ column, query: columnQuery }) =>
        normalizeSearchValue(getColumnValue(row, column)).includes(columnQuery)
      )
    })
  }, [columns, data, search, columnFilters, isServerSide, serverState.items])

  const sortedData = React.useMemo(() => {
    // En modo servidor el orden lo aplica la API; aquí la página ya llega ordenada.
    if (isServerSide || !sort) return filteredData

    const column = columns.find((item) => item.key === sort.key)
    if (!column) return filteredData

    return [...filteredData].sort((left, right) => {
      const result = compareValues(getColumnValue(left, column), getColumnValue(right, column))
      return sort.direction === "asc" ? result : -result
    })
  }, [columns, filteredData, sort, isServerSide])

  const pagination = usePagination(
    sortedData,
    currentPageSize,
    isServerSide ? serverState.total : undefined,
    isServerSide
  )
  const { setPage } = pagination

  // Fetch con debounce (solo cuando se deja de escribir) y cancelación del request previo.
  React.useEffect(() => {
    if (!fetchDataRef.current) return

    const key = JSON.stringify({
      page: pagination.page,
      pageSize: currentPageSize,
      search: debouncedSearch,
      sort,
      refreshKey,
      retryKey,
    })

    // Primera renderización con datos ya presentes: no repetir el fetch inicial.
    if (isFirstRender.current) {
      isFirstRender.current = false
      if (serverState.items.length > 0) {
        lastFetchKey.current = key
        return
      }
    }

    // Mismos parámetros que el último fetch → no repetir.
    if (lastFetchKey.current === key) return
    lastFetchKey.current = key

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setServerLoading(true)

    fetchDataRef.current(
      { page: pagination.page, pageSize: currentPageSize, search: debouncedSearch, sort },
      controller.signal
    )
      .then((result) => {
        if (controller.signal.aborted) return
        setServerState(result)
        setServerError(null)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setServerError(error instanceof Error ? error.message : "Error al cargar los datos.")
      })
      .finally(() => {
        // Solo el request vigente apaga el loading; los abortados no tocan el estado.
        if (abortRef.current !== controller) return
        setServerLoading(false)
      })

    return () => {
      controller.abort()
      // Si este fetch era el último registrado, se invalida para que la próxima
      // corrida del efecto (StrictMode, cambio de deps) lo vuelva a disparar.
      if (lastFetchKey.current === key) lastFetchKey.current = ""
    }
    // `fetchData` va por ref a propósito: su identidad no debe retriggerar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, currentPageSize, debouncedSearch, sort, refreshKey, retryKey])

  // Al cambiar cualquier filtro u orden, la página vuelve a 1 (evita quedar en una página vacía).
  React.useEffect(() => {
    setPage(1)
  }, [search, columnFilters, sort, setPage])

  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [clearSelectionKey])

  React.useEffect(() => {
    if (!selectable) return
    // En modo servidor las filas viven en serverState, no en `data`.
    const source = isServerSide ? serverState.items : data
    const rows = source.filter((row) => selectedIds.has(getRowId!(row)))
    // Firma por ids: no emite (ni re-renderiza al padre) si la selección no cambió,
    // cortando el bucle con `data={[]}` recreado en cada render del padre.
    const signature = JSON.stringify(rows.map((row) => getRowId!(row)).sort())
    if (lastSelectionSignature.current === signature) return
    lastSelectionSignature.current = signature
    onSelectionChange?.(rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, data, serverState.items, selectable])

  function toggleSort(column: DataTableColumn<T>) {
    if (column.sortable === false) return

    setSort((current) => {
      if (!current || current.key !== column.key) {
        return { key: column.key, direction: "asc" }
      }
      return { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
    })
  }

  function startResize(event: React.PointerEvent, key: string) {
    event.preventDefault()
    event.stopPropagation()

    // table-layout:auto ignora un ancho fijo en una sola columna: al primer resize
    // se congelan los anchos actuales de todas y se pasa a table-layout:fixed.
    if (!layoutFixed) {
      const measured: Record<string, number> = {}
      orderedColumns.forEach((c) => {
        const el = theadRefs.current[c.key]
        if (el) measured[c.key] = el.getBoundingClientRect().width
      })
      setColWidths((prev) => ({ ...measured, ...prev }))
      setLayoutFixed(true)
    }

    const th = theadRefs.current[key]
    const startWidth = th?.getBoundingClientRect().width ?? 150
    const startX = event.clientX

    function onMove(ev: PointerEvent) {
      setColWidths((prev) => ({ ...prev, [key]: Math.max(60, startWidth + (ev.clientX - startX)) }))
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  function handleDrop(targetKey: string) {
    return (event: React.DragEvent) => {
      event.preventDefault()
      if (!draggedKey || draggedKey === targetKey) return
      setOrder((prev) => {
        const next = prev.filter((k) => k !== draggedKey)
        next.splice(next.indexOf(targetKey), 0, draggedKey)
        return next
      })
      setDraggedKey(null)
    }
  }

  function toggleRow(id: string | number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pageIds = selectable ? (pagination.pageItems ?? []).map((row) => getRowId!(row)) : []
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const somePageSelected = !allPageSelected && pageIds.some((id) => selectedIds.has(id))

  function toggleSelectPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function exportCsv() {
    const exportableColumns = orderedColumns.filter((c) => !isPinnedColumn(c))
    const header = exportableColumns.map((c) => csvCell(typeof c.header === "string" ? c.header : c.key))
    const rows = sortedData.map((row) => exportableColumns.map((c) => csvCell(getColumnValue(row, c))))
    const csv = "﻿" + [header, ...rows].map((r) => r.join(",")).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = exportFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function startEdit(index: number, column: DataTableColumn<T>, row: T) {
    if (!column.edit || editing) return
    setEditing({ index, key: column.key, value: String(getColumnValue(row, column) ?? ""), saving: false })
  }

  async function commitEdit(row: T) {
    if (!editing || editing.saving) return
    const column = orderedColumns.find((c) => c.key === editing.key)
    if (!column?.edit) {
      setEditing(null)
      return
    }

    const original = String(getColumnValue(row, column) ?? "")
    if (original === editing.value) {
      setEditing(null)
      return
    }

    let parsed: string | number = editing.value
    if (column.edit.type === "number") {
      parsed = Number(editing.value)
      if (Number.isNaN(parsed)) {
        toast.error("Valor numérico inválido.")
        return
      }
    }

    setEditing((current) => (current ? { ...current, saving: true } : current))
    try {
      await column.edit.onSave(row, parsed)
      setEditing(null)
    } catch {
      toast.error("No se pudo guardar el cambio.")
      setEditing((current) => (current ? { ...current, saving: false } : current))
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 rounded-xl pl-9 bg-background/60 backdrop-blur-sm border-muted/60 focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="size-3.5" aria-hidden />
            Limpiar filtros
          </Button>
        )}
        {selectable && selectedIds.size > 0 && (
          <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {selectedIds.size} seleccionado(s)
          </span>
        )}
        <Button type="button" variant="outline" size="sm" className="ml-auto gap-1.5" onClick={exportCsv}>
          <Download className="size-4" aria-hidden />
          Exportar CSV
        </Button>
      </div>

      <div className="relative rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm" style={layoutFixed ? { tableLayout: "fixed" } : undefined}>
            <colgroup>
              {selectable && <col className="w-10" />}
              <col className="w-12" />
              {orderedColumns.map((column) => (
                <col key={column.key} style={colWidths[column.key] ? { width: colWidths[column.key] } : undefined} />
              ))}
            </colgroup>
            <thead className="bg-muted/30 [&_tr]:border-b">
              <tr>
                {selectable && (
                  <th className="h-10 px-2 text-left align-middle font-semibold text-xs tracking-wide uppercase text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary rounded border-muted-foreground/30"
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = somePageSelected
                      }}
                      onChange={toggleSelectPage}
                      aria-label="Seleccionar todas las filas de esta página"
                    />
                  </th>
                )}
                <th className="h-10 px-2 text-right align-middle font-semibold text-xs tracking-wide uppercase text-muted-foreground w-12">
                  N°
                </th>
                {orderedColumns.map((column) => {
                  const isSorted = sort?.key === column.key
                  const SortIcon = isSorted ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown
                  const pinned = isPinnedColumn(column)

                  return (
                    <th
                      key={column.key}
                      ref={(el) => {
                        theadRefs.current[column.key] = el
                      }}
                      className={cn(
                        "relative select-none h-10 px-2 text-left align-middle font-semibold text-xs tracking-wide uppercase text-muted-foreground",
                        !pinned && "cursor-grab active:cursor-grabbing",
                        column.className
                      )}
                      draggable={!pinned}
                      onDragStart={() => setDraggedKey(column.key)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDrop(column.key)}
                      onDragEnd={() => setDraggedKey(null)}
                    >
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 text-left",
                          column.sortable !== false && "cursor-pointer hover:text-foreground"
                        )}
                        onClick={() => toggleSort(column)}
                        disabled={column.sortable === false}
                        aria-label={column.sortable === false ? undefined : `Ordenar por ${String(column.header)}`}
                      >
                        {column.header}
                        {column.sortable !== false && (
                          <SortIcon className={cn("size-3.5", isSorted ? "text-primary" : "text-muted-foreground/60")} aria-hidden />
                        )}
                      </button>
                      {!pinned && (
                        <div
                          onPointerDown={(event) => startResize(event, column.key)}
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize touch-none hover:bg-primary/30 active:bg-primary/50 transition-colors"
                          aria-hidden
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
              <tr className="hover:bg-transparent">
                {selectable && <th className="py-1 px-2" />}
                <th className="py-1 px-2 w-12" />
                {orderedColumns.map((column) => (
                  <th key={`filter-${column.key}`} className={cn("py-1 px-2", column.className)}>
                    {column.filterable !== false && (
                      <Input
                        value={columnFilters[column.key] ?? ""}
                        onChange={(event) =>
                          setColumnFilters((current) => ({ ...current, [column.key]: event.target.value }))
                        }
                        placeholder="Filtrar..."
                        aria-label={`Filtrar por ${String(column.header)}`}
                        className="h-7 text-xs font-normal bg-transparent border-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isServerSide && serverLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b transition-colors even:bg-muted/30">
                    {selectable && (
                      <td className="p-2 align-middle whitespace-nowrap">
                        <Skeleton className="size-4 rounded" />
                      </td>
                    )}
                    <td className="p-2 align-middle whitespace-nowrap text-right">
                      <Skeleton className="ml-auto h-4 w-6" />
                    </td>
                    {orderedColumns.map((column) => (
                      <td key={column.key} className={cn("p-2 align-middle whitespace-nowrap", column.className)}>
                        <Skeleton className="h-4 w-full max-w-32" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isServerSide && serverError ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 1 + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-sm text-muted-foreground">{serverError}</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setRetryKey((k) => k + 1)}>
                        Reintentar
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.pageItems?.map((row, index) => {
                  const id = selectable ? getRowId!(row) : null
                  return (
                    <tr
                      key={id ?? index}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/40 even:bg-muted/20 data-[state=selected]:bg-muted/60",
                        id !== null && selectedIds.has(id) && "bg-muted/50"
                      )}
                      data-state={id !== null && selectedIds.has(id) ? "selected" : undefined}
                    >
                      {selectable && (
                        <td className="p-2 align-middle whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary rounded border-muted-foreground/30"
                            checked={selectedIds.has(id!)}
                            onChange={() => toggleRow(id!)}
                            aria-label="Seleccionar fila"
                          />
                        </td>
                      )}
                      <td className="p-2 align-middle whitespace-nowrap text-right tabular-nums text-muted-foreground/70 text-xs">
                        {(pagination.page - 1) * currentPageSize + index + 1}
                      </td>
                      {orderedColumns.map((column) => {
                        const value = getColumnValue(row, column)
                        const isEditing = editing?.index === index && editing.key === column.key

                        if (isEditing) {
                          return (
                            <td key={column.key} className={cn("p-2 align-middle whitespace-nowrap", column.className)}>
                              <input
                                autoFocus
                                type={column.edit?.type === "number" ? "number" : "text"}
                                value={editing.value}
                                disabled={editing.saving}
                                onChange={(event) =>
                                  setEditing((current) => (current ? { ...current, value: event.target.value } : current))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") commitEdit(row)
                                  if (event.key === "Escape") setEditing(null)
                                }}
                                onBlur={() => commitEdit(row)}
                                className="h-7 w-full min-w-0 rounded-md border border-primary/30 bg-background px-2 text-sm outline-none ring-2 ring-primary/20 focus:ring-primary/40 disabled:opacity-50 transition-all"
                              />
                            </td>
                          )
                        }

                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "p-2 align-middle whitespace-nowrap",
                              column.className,
                              column.edit && "cursor-text hover:bg-muted/30 rounded transition-colors"
                            )}
                            onDoubleClick={() => startEdit(index, column, row)}
                            title={column.edit ? "Doble clic para editar" : undefined}
                          >
                            {column.render ? column.render(value, row) : (
                              <span className="block truncate max-w-full">
                                {String(value ?? "-")}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
              {!serverLoading && !serverError && pagination.totalItems === 0 && (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 1 + (selectable ? 1 : 0)}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        {...pagination}
        onPageChange={pagination.setPage}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={(size: number) => {
          setCurrentPageSize(size)
          setPage(1)
        }}
        siblingCount={1}
      />
    </div>
  )
}

// Componentes exportados
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-2xl border bg-card shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/40 [&_tr]:border-b", className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 even:bg-muted/30 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentProps<"th">>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-semibold text-xs tracking-wide whitespace-nowrap uppercase text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  DataTable,
}