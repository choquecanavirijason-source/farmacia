"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { DataTableColumn } from "./types"
import { DraggableRow } from "./draggable-row"
import { TableDataCell, type EditState } from "./table-cell"

interface TableBodyProps<T> {
    data: T[]
    columns: DataTableColumn<T>[]
    selectable: boolean
    showGripColumn: boolean
    selectedIds: Set<string | number>
    toggleRow: (id: string | number) => void
    pagination: { page: number; pageSize: number; pageItems?: T[] | null; totalItems: number }
    getRowId?: (row: T) => string | number
    emptyMessage: string
    serverError?: string | null
    onRetry?: () => void
    showSkeleton: boolean
    canDragRows: boolean
    isRowDragDisabled: boolean
    moveRow: (dragIndex: number, hoverIndex: number) => void
    findRowIndex: (id: string | number) => number
    commitReorder: () => void
    editing: EditState | null
    setEditing: React.Dispatch<React.SetStateAction<EditState | null>>
    startEdit: (index: number, column: DataTableColumn<T>, row: T) => void
    commitEdit: (row: T) => void
}

export function TableBody<T>({
    data,
    columns,
    selectable,
    showGripColumn,
    selectedIds,
    toggleRow,
    pagination,
    getRowId,
    emptyMessage,
    serverError,
    onRetry,
    showSkeleton,
    canDragRows,
    isRowDragDisabled,
    moveRow,
    findRowIndex,
    commitReorder,
    editing,
    setEditing,
    startEdit,
    commitEdit,
}: TableBodyProps<T>) {
    const pageItems = pagination.pageItems ?? []

    if (showSkeleton) {
        return (
            <>
                {Array.from({ length: Math.min(pagination.pageSize, 5) }).map((_, i) => (
                    <tr key={i} className="border-b transition-colors even:bg-muted/30">
                        {showGripColumn && (
                            <td className="p-2 align-middle whitespace-nowrap w-7">
                                <Skeleton className="h-4 w-4 rounded" />
                            </td>
                        )}
                        {selectable && (
                            <td className="p-2 align-middle whitespace-nowrap">
                                <Skeleton className="size-4 rounded" />
                            </td>
                        )}
                        {columns.map((column) => (
                            <td key={column.key} className={cn("p-2 align-middle whitespace-nowrap", column.className)}>
                                <Skeleton className="h-4 w-full max-w-32" />
                            </td>
                        ))}
                    </tr>
                ))}
            </>
        )
    }

    if (serverError && data.length === 0) {
        return (
            <tr>
                <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (showGripColumn ? 1 : 0)}
                    className="h-24 text-center"
                >
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-muted-foreground">{serverError}</p>
                        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                            Reintentar
                        </Button>
                    </div>
                </td>
            </tr>
        )
    }

    if (pageItems.length === 0) {
        return (
            <tr>
                <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (showGripColumn ? 1 : 0)}
                    className="h-32 text-center"
                >
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                </td>
            </tr>
        )
    }

    if (canDragRows && getRowId) {
        return (
            <>
                {pageItems.map((row, index) => {
                    const id = getRowId(row)
                    return (
                        <DraggableRow
                            key={id}
                            row={row}
                            index={index}
                            id={id}
                            columns={columns}
                            selectable={!!selectable}
                            selectedIds={selectedIds}
                            toggleRow={toggleRow}
                            isDisabled={isRowDragDisabled}
                            moveRow={moveRow}
                            findRowIndex={findRowIndex}
                            commitReorder={commitReorder}
                            editing={editing}
                            setEditing={setEditing}
                            startEdit={startEdit}
                            commitEdit={commitEdit}
                        />
                    )
                })}
            </>
        )
    }

    return (
        <>
            {pageItems.map((row, index) => {
                const id = selectable && getRowId ? getRowId(row) : null
                const isSelected = id !== null && selectedIds.has(id)

                return (
                    <tr
                        key={id ?? index}
                        className={cn(
                            "border-b transition-colors hover:bg-muted/50 even:bg-muted/40 data-[state=selected]:bg-muted/60",
                            isSelected && "bg-muted/50"
                        )}
                        data-state={isSelected ? "selected" : undefined}
                    >
                        {selectable && (
                            <td className="p-2 align-middle whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-primary rounded border-muted-foreground/30"
                                    checked={isSelected}
                                    onChange={() => toggleRow(id!)}
                                    aria-label="Seleccionar fila"
                                />
                            </td>
                        )}
                        {columns.map((column) => (
                            <TableDataCell
                                key={column.key}
                                column={column}
                                row={row}
                                index={index}
                                editing={editing}
                                setEditing={setEditing}
                                startEdit={startEdit}
                                commitEdit={commitEdit}
                            />
                        ))}
                    </tr>
                )
            })}
        </>
    )
}
