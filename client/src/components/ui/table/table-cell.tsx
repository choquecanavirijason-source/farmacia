"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { DataTableColumn } from "./types"
import { getColumnValue } from "./table-utils"

export interface EditState {
    index: number
    key: string
    value: string
    saving: boolean
}

interface TableDataCellProps<T> {
    column: DataTableColumn<T>
    row: T
    index: number
    editing: EditState | null
    setEditing: React.Dispatch<React.SetStateAction<EditState | null>>
    startEdit: (index: number, column: DataTableColumn<T>, row: T) => void
    commitEdit: (row: T) => void
}

export function TableDataCell<T>({
    column,
    row,
    index,
    editing,
    setEditing,
    startEdit,
    commitEdit,
}: TableDataCellProps<T>) {
    const value = getColumnValue(row, column)
    const isEditing = editing?.index === index && editing.key === column.key

    if (isEditing && editing) {
        return (
            <td className={cn("p-2 align-middle whitespace-nowrap", column.className)}>
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
            className={cn(
                "p-2 align-middle whitespace-nowrap",
                column.className,
                column.edit && "cursor-text hover:bg-muted/30 rounded transition-colors"
            )}
            onDoubleClick={() => column.edit && startEdit(index, column, row)}
            title={column.edit ? "Doble clic para editar" : undefined}
        >
            {column.render ? column.render(value, row) : (
                <span className="block truncate max-w-full">
                    {String(value ?? "-")}
                </span>
            )}
        </td>
    )
}
