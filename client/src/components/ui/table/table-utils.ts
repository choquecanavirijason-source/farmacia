import * as React from "react"
import type { DataTableColumn, DataTableValue } from "./types"

export function isPinnedColumn<T>(column: DataTableColumn<T>) {
    return column.sortable === false && column.filterable === false
}

export function getColumnValue<T>(row: T, column: DataTableColumn<T>) {
    return typeof column.accessor === "function"
        ? column.accessor(row)
        : (row[column.accessor] as DataTableValue)
}

export function normalizeSearchValue(value: DataTableValue) {
    if (value instanceof Date) return value.toLocaleDateString()
    return String(value ?? "").toLocaleLowerCase()
}

export function compareValues(left: DataTableValue, right: DataTableValue) {
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

export function csvCell(value: DataTableValue) {
    const text = value instanceof Date ? value.toLocaleDateString() : String(value ?? "")
    return /["\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = [...array]
    const [removed] = newArray.splice(from, 1)
    newArray.splice(to, 0, removed)
    return newArray
}

export const ItemTypes = {
    COLUMN: "column",
    ROW: "row",
}

function useStoredSnapshot<T>(key: string, initialValue: T, enabled: boolean): T {
    const cacheRef = React.useRef<{ raw: string | null; value: T }>({ raw: null, value: initialValue })

    const getSnapshot = React.useCallback((): T => {
        if (!enabled) return initialValue
        let raw: string | null = null
        try {
            raw = window.localStorage.getItem(key)
        } catch {
            return initialValue
        }
        if (raw === null) return initialValue
        const cache = cacheRef.current
        if (raw === cache.raw) return cache.value
        try {
            const parsed = JSON.parse(raw) as T
            cacheRef.current = { raw, value: parsed }
            return parsed
        } catch {
            return initialValue
        }
    }, [key, initialValue, enabled])

    const getServerSnapshot = React.useCallback(() => initialValue, [initialValue])

    const subscribe = React.useCallback((callback: () => void) => {
        window.addEventListener("storage", callback)
        return () => window.removeEventListener("storage", callback)
    }, [])

    return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Estado respaldado en localStorage (columna con orden/anchuras). Cuando
 * `enabled` es false se comporta como un useState normal.
 */
export function useLocalStorageState<T>(key: string, initialValue: T, enabled = true) {
    const [localValue, setLocalValue] = React.useState(initialValue)
    const storedValue = useStoredSnapshot(key, initialValue, enabled)

    const setStoredValue = React.useCallback((next: T | ((prev: T) => T)) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(storedValue) : next
        try {
            const raw = JSON.stringify(resolved)
            window.localStorage.setItem(key, raw)
        } catch { }
        window.dispatchEvent(new StorageEvent("storage", { key }))
    }, [key, storedValue])

    if (!enabled) return [localValue, setLocalValue] as const
    return [storedValue, setStoredValue] as const
}