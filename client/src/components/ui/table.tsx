"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search, X } from "lucide-react"
import { toast } from "sonner"

import { TablePagination } from "@/components/layout/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const selectable = Boolean(getRowId)

  // Si cambian las columnas (otra página montó este mismo componente), el orden se reinicia.
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
    const query = search.trim().toLocaleLowerCase()
    const activeColumnFilters = columns
      .map((column) => ({ column, query: (columnFilters[column.key] ?? "").trim().toLocaleLowerCase() }))
      .filter((entry) => entry.query.length > 0)

    return data.filter((row) => {
      if (query && !columns.some((column) => normalizeSearchValue(getColumnValue(row, column)).includes(query))) {
        return false
      }
      return activeColumnFilters.every(({ column, query: columnQuery }) =>
        normalizeSearchValue(getColumnValue(row, column)).includes(columnQuery)
      )
    })
  }, [columns, data, search, columnFilters])

  const sortedData = React.useMemo(() => {
    if (!sort) return filteredData

    const column = columns.find((item) => item.key === sort.key)
    if (!column) return filteredData

    return [...filteredData].sort((left, right) => {
      const result = compareValues(getColumnValue(left, column), getColumnValue(right, column))
      return sort.direction === "asc" ? result : -result
    })
  }, [columns, filteredData, sort])

  const pagination = usePagination(sortedData, currentPageSize)
  const { setPage } = pagination

  // Al cambiar cualquier filtro, la página vuelve a 1 (evita quedar en una página vacía).
  React.useEffect(() => {
    setPage(1)
  }, [search, columnFilters, setPage])

  React.useEffect(() => {
    if (!selectable) return
    onSelectionChange?.(data.filter((row) => selectedIds.has(getRowId!(row))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, data, selectable])

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
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X aria-hidden />
            Limpiar filtros
          </Button>
        )}
        {selectable && selectedIds.size > 0 && (
          <span className="text-sm text-muted-foreground">{selectedIds.size} seleccionado(s)</span>
        )}
        <Button type="button" variant="outline" size="sm" className="ml-auto gap-1.5" onClick={exportCsv}>
          <Download className="size-4" aria-hidden />
          Exportar CSV
        </Button>
      </div>

      <Table style={layoutFixed ? { tableLayout: "fixed" } : undefined}>
        <colgroup>
          {selectable && <col className="w-10" />}
          <col className="w-12" />
          {orderedColumns.map((column) => (
            <col key={column.key} style={colWidths[column.key] ? { width: colWidths[column.key] } : undefined} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = somePageSelected
                  }}
                  onChange={toggleSelectPage}
                  aria-label="Seleccionar todas las filas de esta página"
                />
              </TableHead>
            )}
            <TableHead className="w-12 text-right">N°</TableHead>
            {orderedColumns.map((column) => {
              const isSorted = sort?.key === column.key
              const SortIcon = isSorted ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown
              const pinned = isPinnedColumn(column)

              return (
                <TableHead
                  key={column.key}
                  ref={(el) => {
                    theadRefs.current[column.key] = el
                  }}
                  className={cn("relative select-none", !pinned && "cursor-grab active:cursor-grabbing", column.className)}
                  draggable={!pinned}
                  onDragStart={() => setDraggedKey(column.key)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop(column.key)}
                  onDragEnd={() => setDraggedKey(null)}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 text-left",
                      column.sortable !== false && "cursor-pointer hover:text-foreground"
                    )}
                    onClick={() => toggleSort(column)}
                    disabled={column.sortable === false}
                    aria-label={column.sortable === false ? undefined : `Ordenar por ${String(column.header)}`}
                  >
                    {column.header}
                    {column.sortable !== false && <SortIcon className="size-3.5" aria-hidden />}
                  </button>
                  {!pinned && (
                    <div
                      onPointerDown={(event) => startResize(event, column.key)}
                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize touch-none hover:bg-primary/40"
                      aria-hidden
                    />
                  )}
                </TableHead>
              )
            })}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {selectable && <TableHead className="w-10" />}
            <TableHead className="w-12" />
            {orderedColumns.map((column) => (
              <TableHead key={`filter-${column.key}`} className={cn("py-1", column.className)}>
                {column.filterable !== false && (
                  <Input
                    value={columnFilters[column.key] ?? ""}
                    onChange={(event) =>
                      setColumnFilters((current) => ({ ...current, [column.key]: event.target.value }))
                    }
                    placeholder="Filtrar..."
                    aria-label={`Filtrar por ${String(column.header)}`}
                    className="h-7 text-xs font-normal"
                  />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems?.map((row, index) => {
            const id = selectable ? getRowId!(row) : null
            return (
              <TableRow key={id ?? index} data-state={id !== null && selectedIds.has(id) ? "selected" : undefined}>
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selectedIds.has(id!)}
                      onChange={() => toggleRow(id!)}
                      aria-label="Seleccionar fila"
                    />
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {(pagination.page - 1) * currentPageSize + index + 1}
                </TableCell>
                {orderedColumns.map((column) => {
                  const value = getColumnValue(row, column)
                  const isEditing = editing?.index === index && editing.key === column.key

                  if (isEditing) {
                    return (
                      <TableCell key={column.key} className={column.className}>
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
                          className="h-7 w-full min-w-0 rounded-md border border-ring bg-background px-1.5 text-sm outline-none ring-3 ring-ring/50 disabled:opacity-50"
                        />
                      </TableCell>
                    )
                  }

                  return (
                    <TableCell
                      key={column.key}
                      className={cn(column.className, column.edit && "cursor-text hover:bg-muted/40")}
                      onDoubleClick={() => startEdit(index, column, row)}
                      title={column.edit ? "Doble clic para editar" : undefined}
                    >
                      {column.render ? column.render(value, row) : String(value ?? "-")}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
          {pagination.totalItems === 0 && (
            <TableRow>
              <TableCell
                colSpan={orderedColumns.length + 1 + (selectable ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        {...pagination}
        onPageChange={pagination.setPage}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={(size: number) => {
          setCurrentPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
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

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentProps<"th">>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
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

function TableCaption({
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
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
