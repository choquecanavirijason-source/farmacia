"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePagination } from "@/hooks/use-pagination"
import { useMediaQuery } from "@/hooks/use-media-query"
import { TablePagination } from "./table-pagination"
import { TableHeader } from "./table-header"
import { TableBody } from "./table-body"
import { TableToolbar } from "./table-toolbar"
import type { DataTableProps, DataTableColumn } from "./types"
import { arrayMove, compareValues, getColumnValue, isPinnedColumn, normalizeSearchValue, useLocalStorageState } from "./table-utils"
import type { EditState } from "./table-cell"

function DataTable<T>({
    data,
    columns,
    server,
    pageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    searchPlaceholder = "Buscar en la tabla...",
    emptyMessage = "No se encontraron registros.",
    className,
    getRowId,
    getRowClassName,
    enableSelection,
    onSelectionChange,
    clearSelectionKey,
    exportFilename = "tabla.csv",
    onExport,
    onRefresh,
    enableColumnDrag = false,
    enableRowDrag = false,
    onRowReorder,
    minColumnWidth = 60,
    persistPreferences = false,
    storageKey = "datatable",
}: DataTableProps<T>) {
    const isServerMode = Boolean(server)
    const selectable = enableSelection !== undefined ? enableSelection : Boolean(onSelectionChange)
    const canDragRows = enableRowDrag && !!getRowId && !!onRowReorder
    const showGripColumn = canDragRows
    const isMobile = useMediaQuery("(max-width: 640px)")
    const columnDragEnabled = enableColumnDrag && !isMobile

    const [search, setSearch] = React.useState("")
    const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({})
    const [sort, setSort] = React.useState<{ key: string; direction: "asc" | "desc" } | null>(null)
    const [currentPageSize, setCurrentPageSize] = React.useState(pageSize)

    const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set())
    const [editing, setEditing] = React.useState<EditState | null>(null)
    const lastSelectionSignature = React.useRef<string | null>(null)

    const columnKeys = columns.map((c) => c.key)
    const joinedColumnKeys = columnKeys.join("\u0000")

    const [order, setOrder] = useLocalStorageState<string[]>(`${storageKey}-column-order`, columnKeys, persistPreferences)
    const [colWidths, setColWidths] = useLocalStorageState<Record<string, number>>(
        `${storageKey}-column-widths`,
        {},
        persistPreferences
    )
    const effectiveColWidths = React.useMemo(() => {
        const validKeys = new Set(columnKeys)
        return Object.fromEntries(Object.entries(colWidths).filter(([k]) => validKeys.has(k)))
    }, [colWidths, columnKeys])
    const layoutFixed = Object.keys(effectiveColWidths).length > 0

    const [draggedKey, setDraggedKey] = React.useState<string | null>(null)
    const theadRefs = React.useRef<Record<string, HTMLTableCellElement | null>>({})
    const registerThRef = React.useCallback((key: string, el: HTMLTableCellElement | null) => {
        theadRefs.current[key] = el
    }, [])

    const [localData, setLocalData] = React.useState<T[]>(data)

    const [knownKeys, setKnownKeys] = React.useState(joinedColumnKeys)
    if (knownKeys !== joinedColumnKeys) {
        setKnownKeys(joinedColumnKeys)
        setOrder(columnKeys)
    }

    const [lastData, setLastData] = React.useState(data)
    if (lastData !== data) {
        setLastData(data)
        setLocalData(data)
    }

    const [lastClearKey, setLastClearKey] = React.useState(clearSelectionKey)
    if (lastClearKey !== clearSelectionKey) {
        setLastClearKey(clearSelectionKey)
        setSelectedIds(new Set())
    }

    const orderedColumns = React.useMemo(() => {
        const byKey = new Map(columns.map((c) => [c.key, c]))
        const validOrder = order.filter((k) => byKey.has(k))
        const dataKeys = validOrder.length === columns.length ? validOrder : columnKeys
        const dataColumns = dataKeys
            .filter((k) => !isPinnedColumn(byKey.get(k)!))
            .map((k) => byKey.get(k)!)
        const pinnedColumns = columns.filter((c) => isPinnedColumn(c))
        return [...dataColumns, ...pinnedColumns]
    }, [order, columns, columnKeys])

    const finalData = canDragRows ? localData : data

    const filteredData = React.useMemo(() => {
        if (isServerMode) return finalData

        const activeColumnFilters = columns
            .map((column) => ({ column, query: (columnFilters[column.key] ?? "").trim().toLocaleLowerCase() }))
            .filter((entry) => entry.query.length > 0)

        const query = search.trim().toLocaleLowerCase()
        return finalData.filter((row) => {
            if (query && !columns.some((column) => normalizeSearchValue(getColumnValue(row, column)).includes(query))) {
                return false
            }
            return activeColumnFilters.every(({ column, query: columnQuery }) =>
                normalizeSearchValue(getColumnValue(row, column)).includes(columnQuery)
            )
        })
    }, [isServerMode, finalData, columns, search, columnFilters])

    const sortedData = React.useMemo(() => {
        if (isServerMode || !sort) return filteredData

        const column = columns.find((item) => item.key === sort.key)
        if (!column) return filteredData

        return [...filteredData].sort((left, right) => {
            const result = compareValues(getColumnValue(left, column), getColumnValue(right, column))
            return sort.direction === "asc" ? result : -result
        })
    }, [isServerMode, columns, filteredData, sort])

    const localPagination = usePagination(sortedData, currentPageSize)

    const serverPagination = React.useMemo(() => {
        if (!isServerMode || !server) return null
        const pageCount = Math.max(1, Math.ceil(server.total / server.params.pageSize))
        return {
            page: Math.min(server.params.page, pageCount),
            pageCount,
            pageItems: finalData,
            totalItems: server.total,
            pageSize: server.params.pageSize,
        }
    }, [isServerMode, server, finalData])

    const pagination = isServerMode && serverPagination ? serverPagination : localPagination

    const hasActiveFilters = isServerMode
        ? server ? server.params.search.trim().length > 0 || server.params.sort !== null : false
        : search.trim().length > 0
            || Object.values(columnFilters).some((value) => value.trim().length > 0)
            || sort !== null

    const moveRow = React.useCallback((dragIndex: number, hoverIndex: number) => {
        setLocalData((prevData) => arrayMove(prevData, dragIndex, hoverIndex))
    }, [])

    const localDataRef = React.useRef(localData)
    React.useEffect(() => {
        localDataRef.current = localData
    }, [localData])
    const commitReorder = React.useCallback(() => {
        onRowReorder?.(localDataRef.current)
    }, [onRowReorder])

    const findRowIndex = React.useCallback((id: string | number) => {
        return localData.findIndex((row) => String(getRowId!(row)) === String(id))
    }, [localData, getRowId])

    function handleSearchChange(value: string) {
        if (isServerMode && server) server.onParamsChange({ ...server.params, search: value, page: 1 })
        else setSearch(value)
    }

    function clearFilters() {
        if (isServerMode && server) {
            server.onParamsChange({ ...server.params, search: "", sort: null, page: 1 })
        } else {
            setSearch("")
            setColumnFilters({})
            setSort(null)
        }
    }

    function toggleSort(column: DataTableColumn<T>) {
        if (column.sortable === false) return

        if (isServerMode && server) {
            const current = server.params.sort
            const next = !current || current.key !== column.key
                ? { key: column.key, direction: "asc" as const }
                : { key: column.key, direction: current.direction === "asc" ? "desc" as const : "asc" as const }
            server.onParamsChange({ ...server.params, sort: next, page: 1 })
            return
        }

        setSort((current) => {
            if (!current || current.key !== column.key) {
                return { key: column.key, direction: "asc" }
            }
            return { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
        })
    }

    function handlePageChange(page: number) {
        if (isServerMode && server) server.onParamsChange({ ...server.params, page })
        else localPagination.setPage(page)
    }

    function handlePageSizeChange(size: number) {
        if (isServerMode && server) server.onParamsChange({ ...server.params, pageSize: size, page: 1 })
        else {
            setCurrentPageSize(size)
            localPagination.setPage(1)
        }
    }

    function startResize(event: React.PointerEvent, key: string) {
        if (isMobile) return
        const column = orderedColumns.find(c => c.key === key)
        if (column?.resizable === false) return

        event.preventDefault()
        event.stopPropagation()

        if (!layoutFixed) {
            const measured: Record<string, number> = {}
            orderedColumns.forEach((c) => {
                const el = theadRefs.current[c.key]
                if (el) measured[c.key] = el.getBoundingClientRect().width
            })
            setColWidths((prev) => ({ ...measured, ...prev }))
        }

        const th = theadRefs.current[key]
        const startWidth = th?.getBoundingClientRect().width ?? 150
        const startX = event.clientX

        function onMove(ev: PointerEvent) {
            const newWidth = Math.max(minColumnWidth, startWidth + (ev.clientX - startX))
            setColWidths((prev) => ({ ...prev, [key]: newWidth }))
        }
        function onUp() {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
        }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
    }

    function handleDrop(targetKey: string) {
        if (!draggedKey || draggedKey === targetKey || !columnDragEnabled) return
        setOrder((prev) => {
            const fromIndex = prev.indexOf(draggedKey)
            const toIndex = prev.indexOf(targetKey)
            const next = prev.filter((k) => k !== draggedKey)
            const insertAt = toIndex > fromIndex
                ? next.indexOf(targetKey) + 1
                : next.indexOf(targetKey)
            next.splice(insertAt, 0, draggedKey)
            return next
        })
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

    React.useEffect(() => {
        if (!selectable) return
        const selected = finalData.filter((row) => selectedIds.has(getRowId!(row)))
        const signature = JSON.stringify(selected.map((row) => getRowId!(row)).sort())
        if (lastSelectionSignature.current === signature) return
        lastSelectionSignature.current = signature
        onSelectionChange?.(selected)
    }, [selectedIds, finalData, selectable, getRowId, onSelectionChange])

    function exportCsv() {
        const exportableColumns = orderedColumns.filter((c) => c.sortable !== false || c.filterable !== false)
        const header = exportableColumns.map((c) => {
            if (typeof c.header === "string") return `"${c.header.replace(/"/g, '""')}"`
            return `"${c.key}"`
        })
        const rowsForExport = isServerMode ? finalData : sortedData
        const csvRows = rowsForExport.map((row) =>
            exportableColumns.map((c) => {
                const value = getColumnValue(row, c)
                const text = value instanceof Date ? value.toLocaleDateString() : String(value ?? "")
                return /["\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
            })
        )
        const csv = "﻿" + [header, ...csvRows].map((r) => r.join(",")).join("\r\n")
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

    const serverLoading = isServerMode && server?.loading
    const serverError = isServerMode ? (server?.error ?? null) : null
    const showSkeleton = Boolean(serverLoading && data.length === 0)
    const isRowDragDisabled = !enableRowDrag || !onRowReorder
    const refreshHandler = onRefresh ?? server?.onRetry

    return (
        <div className={cn("space-y-4", className)}>
                <TableToolbar
                    searchValue={isServerMode && server ? server.params.search : search}
                    onSearchChange={handleSearchChange}
                    searchPlaceholder={searchPlaceholder}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                    selectedCount={selectedIds.size}
                    exportFilename={exportFilename}
                    onExport={onExport}
                    onExportCsv={exportCsv}
                    onRefresh={refreshHandler}
                    loading={serverLoading}
                />

                {isServerMode && serverError && data.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5">
                        <p className="text-sm text-destructive">{serverError}</p>
                        <Button type="button" variant="outline" size="sm" onClick={server?.onRetry}>
                            Reintentar
                        </Button>
                    </div>
                )}

                <div className="relative rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table
                            className={cn(
                                "w-full caption-bottom text-sm",
                                "[&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-r [&_td:last-child]:border-r-0 [&_td]:border-border/60 [&_th]:border-border/60",
                                serverLoading && data.length > 0 && "pointer-events-none opacity-60 transition-opacity"
                            )}
                            style={layoutFixed ? { tableLayout: "fixed" } : undefined}
                            aria-busy={Boolean(serverLoading)}
                        >
                            <colgroup>
                                {showGripColumn && <col className="w-7" />}
                                {selectable && <col className="w-10" />}
                                {orderedColumns.map((column) => (
                                    <col key={column.key} style={effectiveColWidths[column.key] ? { width: effectiveColWidths[column.key] } : undefined} />
                                ))}
                            </colgroup>

                            <TableHeader
                                columns={orderedColumns}
                                selectable={!!selectable}
                                showDragHandle={showGripColumn}
                                isServerMode={isServerMode}
                                server={server}
                                sort={sort}
                                columnFilters={columnFilters}
                                setColumnFilters={setColumnFilters}
                                toggleSort={toggleSort}
                                enableColumnDrag={columnDragEnabled}
                                resizeEnabled={!isMobile}
                                draggedKey={draggedKey}
                                setDraggedKey={setDraggedKey}
                                registerThRef={registerThRef}
                                startResize={startResize}
                                handleDrop={handleDrop}
                                allPageSelected={allPageSelected}
                                somePageSelected={somePageSelected}
                                toggleSelectPage={toggleSelectPage}
                            />

                            <tbody className="[&_tr:last-child]:border-0">
                                <TableBody
                                    data={data}
                                    columns={orderedColumns}
                                    selectable={!!selectable}
                                    showGripColumn={showGripColumn}
                                    selectedIds={selectedIds}
                                    toggleRow={toggleRow}
                                    pagination={pagination}
                                    getRowId={getRowId}
                                    getRowClassName={getRowClassName}
                                    emptyMessage={emptyMessage}
                                    serverError={serverError}
                                    onRetry={server?.onRetry}
                                    showSkeleton={showSkeleton}
                                    canDragRows={canDragRows}
                                    isRowDragDisabled={isRowDragDisabled}
                                    moveRow={moveRow}
                                    findRowIndex={findRowIndex}
                                    commitReorder={commitReorder}
                                    editing={editing}
                                    setEditing={setEditing}
                                    startEdit={startEdit}
                                    commitEdit={commitEdit}
                                />
                            </tbody>
                        </table>
                    </div>
                </div>

                <TablePagination
                    page={pagination.page}
                    pageCount={pagination.pageCount}
                    pageSize={pagination.pageSize}
                    totalItems={pagination.totalItems}
                    onPageChange={handlePageChange}
                    pageSizeOptions={pageSizeOptions}
                    onPageSizeChange={handlePageSizeChange}
                    siblingCount={1}
                />
            </div>
    )
}

export { DataTable }
export * from "./types"
