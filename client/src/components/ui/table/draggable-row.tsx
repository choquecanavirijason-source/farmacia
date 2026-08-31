"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import { useDrag, useDrop } from "react-dnd"
import { cn } from "@/lib/utils"
import type { DataTableColumn } from "./types"
import { ItemTypes } from "./table-utils"
import { TableDataCell, type EditState } from "./table-cell"

interface DraggableRowProps<T> {
    row: T
    index: number
    id: string | number
    columns: DataTableColumn<T>[]
    selectable: boolean
    selectedIds: Set<string | number>
    toggleRow: (id: string | number) => void
    isDisabled?: boolean
    moveRow: (dragIndex: number, hoverIndex: number) => void
    findRowIndex: (id: string | number) => number
    commitReorder: () => void
    editing: EditState | null
    setEditing: React.Dispatch<React.SetStateAction<EditState | null>>
    startEdit: (index: number, column: DataTableColumn<T>, row: T) => void
    commitEdit: (row: T) => void
    rowClassName?: string
}

export function DraggableRow<T>({
    row,
    index,
    id,
    columns,
    selectable,
    selectedIds,
    toggleRow,
    isDisabled,
    moveRow,
    findRowIndex,
    commitReorder,
    editing,
    setEditing,
    startEdit,
    commitEdit,
    rowClassName,
}: DraggableRowProps<T>) {
    const originalIndex = findRowIndex(id)

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.ROW,
        item: { id, originalIndex },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: !isDisabled,
        end: () => commitReorder(),
    })

    const [, drop] = useDrop({
        accept: ItemTypes.ROW,
        hover: ({ id: draggedId }: { id: string | number }) => {
            if (draggedId !== id) {
                const dragIndex = findRowIndex(draggedId)
                const hoverIndex = findRowIndex(id)
                moveRow(dragIndex, hoverIndex)
            }
        },
    })

    const isSelected = selectable && id !== null && selectedIds.has(id)

    const style = {
        opacity: isDragging ? 0.5 : 1,
    }

    const rowRef = React.useRef<HTMLTableRowElement | null>(null)

    React.useEffect(() => {
        if (rowRef.current) {
            preview(drop(rowRef.current))
        }
    }, [preview, drop])

    return (
        <tr
            ref={rowRef}
            style={style}
            className={cn(
                "border-b transition-colors hover:bg-muted/50 even:bg-muted/40 data-[state=selected]:bg-muted/60",
                isSelected && "bg-muted/50",
                isDragging && "shadow-lg ring-2 ring-primary",
                isDisabled && "pointer-events-none opacity-60",
                rowClassName
            )}
            data-state={isSelected ? "selected" : undefined}
        >
            <td className="p-2 align-middle whitespace-nowrap w-7">
                {!isDisabled && (
                    <div
                        ref={(node) => {
                            drag(node)
                        }}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted/50 rounded transition-colors"
                        aria-label="Arrastrar fila"
                    >
                        <GripVertical className="size-3.5 text-muted-foreground" aria-hidden />
                    </div>
                )}
            </td>
            {selectable && (
                <td className="p-2 align-middle whitespace-nowrap">
                    <input
                        type="checkbox"
                        className="size-4 accent-primary rounded border-muted-foreground/30"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
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
}
