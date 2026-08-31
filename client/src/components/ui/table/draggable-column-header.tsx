"use client"

import * as React from "react"
import { useDrag, useDrop } from "react-dnd"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { DataTableColumn } from "./types"
import { ItemTypes } from "./table-utils"

interface DraggableColumnHeaderProps<T> {
    column: DataTableColumn<T>
    index: number
    isSorted: boolean
    SortIcon: LucideIcon
    pinned: boolean
    canResize: boolean
    enableColumnDrag: boolean
    draggedKey: string | null
    setDraggedKey: (key: string | null) => void
    registerThRef: (key: string, el: HTMLTableCellElement | null) => void
    startResize: (event: React.PointerEvent, key: string) => void
    handleDrop: (targetKey: string) => void
    toggleSort: (column: DataTableColumn<T>) => void
}

export function DraggableColumnHeader<T>({
    column,
    index,
    isSorted,
    SortIcon,
    pinned,
    canResize,
    enableColumnDrag,
    draggedKey,
    setDraggedKey,
    registerThRef,
    startResize,
    handleDrop,
    toggleSort,
}: DraggableColumnHeaderProps<T>) {
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.COLUMN,
        item: () => {
            setDraggedKey(column.key)
            return { key: column.key, index }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: enableColumnDrag && !pinned,
        end: () => setDraggedKey(null),
    })

    const [{ isOver, isAfter }, drop] = useDrop({
        accept: ItemTypes.COLUMN,
        drop: (item: { key: string; index: number }) => {
            if (item.key !== column.key) {
                handleDrop(column.key)
            }
        },
        collect: (monitor) => {
            const item = monitor.getItem<{ key: string; index: number }>()
            const isOver = monitor.isOver()
            return {
                isOver,
                isAfter: isOver && item !== null && item.key !== column.key && item.index < index,
            }
        },
    })

    const showDropIndicator = isOver && enableColumnDrag && draggedKey !== column.key

    return (
        <th
            ref={(el) => {
                registerThRef(column.key, el)
                drag(drop(el))
            }}
            className={cn(
                "relative select-none h-10 px-2 text-left align-middle font-semibold text-xs tracking-wide uppercase text-muted-foreground",
                enableColumnDrag && !pinned && "cursor-grab active:cursor-grabbing",
                draggedKey === column.key && "opacity-50",
                isDragging && "opacity-30",
                column.className
            )}
        >
            <div className="relative">
                {showDropIndicator && (
                    <>
                        <div
                            className={cn(
                                "absolute top-1 bottom-1 w-1 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse",
                                isAfter ? "-right-1" : "-left-1"
                            )}
                        />
                        <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                    </>
                )}
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
            </div>
            {canResize && (
                <div
                    onPointerDown={(event) => startResize(event, column.key)}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize touch-none hover:bg-primary/30 active:bg-primary/50 transition-colors"
                    aria-hidden
                />
            )}
            {isDragging && (
                <div
                    className="absolute inset-0 bg-primary/5 rounded pointer-events-none"
                    style={{
                        boxShadow: "0 0 30px rgba(0,0,0,0.1) inset"
                    }}
                />
            )}
        </th>
    )
}
