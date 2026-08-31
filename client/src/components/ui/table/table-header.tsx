"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, GripVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { DataTableColumn, ServerFetchParams } from "./types"
import { isPinnedColumn } from "./table-utils"
import { DraggableColumnHeader } from "./draggable-column-header"

interface TableHeaderProps<T> {
    columns: DataTableColumn<T>[]
    selectable: boolean
    showDragHandle: boolean
    isServerMode: boolean
    server?: { params: ServerFetchParams }
    sort: { key: string; direction: "asc" | "desc" } | null
    columnFilters: Record<string, string>
    setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>
    toggleSort: (column: DataTableColumn<T>) => void
    enableColumnDrag: boolean
    resizeEnabled: boolean
    draggedKey: string | null
    setDraggedKey: (key: string | null) => void
    registerThRef: (key: string, el: HTMLTableCellElement | null) => void
    startResize: (event: React.PointerEvent, key: string) => void
    handleDrop: (targetKey: string) => void
    allPageSelected: boolean
    somePageSelected: boolean
    toggleSelectPage: () => void
}

export function TableHeader<T>({
    columns,
    selectable,
    showDragHandle,
    isServerMode,
    server,
    sort,
    columnFilters,
    setColumnFilters,
    toggleSort,
    enableColumnDrag,
    resizeEnabled,
    draggedKey,
    setDraggedKey,
    registerThRef,
    startResize,
    handleDrop,
    allPageSelected,
    somePageSelected,
    toggleSelectPage,
}: TableHeaderProps<T>) {
    return (
        <thead className="bg-muted/30 [&_tr]:border-b">
            <tr>
                {showDragHandle && (
                    <th className="h-10 px-2 w-7 align-middle" aria-hidden>
                        <GripVertical className="size-3.5 text-muted-foreground/40" aria-hidden />
                    </th>
                )}
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
                {columns.map((column) => {
                    const activeSort = isServerMode && server ? server.params.sort : sort
                    const isSorted = activeSort?.key === column.key
                    const sortDir = activeSort?.direction
                    const SortIcon = isSorted ? (sortDir === "asc" ? ArrowDown : ArrowUp) : ChevronsUpDown
                    const pinned = isPinnedColumn(column)
                    const canResize = column.resizable !== false && resizeEnabled

                    return (
                        <DraggableColumnHeader
                            key={column.key}
                            column={column}
                            index={columns.indexOf(column)}
                            isSorted={isSorted}
                            SortIcon={SortIcon}
                            pinned={pinned}
                            canResize={canResize}
                            enableColumnDrag={enableColumnDrag}
                            draggedKey={draggedKey}
                            setDraggedKey={setDraggedKey}
                            registerThRef={registerThRef}
                            startResize={startResize}
                            handleDrop={handleDrop}
                            toggleSort={toggleSort}
                        />
                    )
                })}
            </tr>
            {!isServerMode && (
                <tr className="hover:bg-transparent">
                    {selectable && <th className="py-1 px-2" />}
                    {columns.map((column) => (
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
            )}
        </thead>
    )
}
