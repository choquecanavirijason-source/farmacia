"use client"

import * as React from "react"
import { Download, FileSpreadsheet, FileText, Loader2, RotateCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TableToolbarProps {
    searchValue: string
    onSearchChange: (value: string) => void
    searchPlaceholder: string
    hasActiveFilters: boolean
    onClearFilters: () => void
    selectedCount: number
    exportFilename?: string
    onExport?: (format: "excel" | "pdf") => void | Promise<any>
    onExportCsv?: () => void
    onRefresh?: () => void | Promise<any>
    loading?: boolean
    className?: string
}

export function TableToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder,
    hasActiveFilters,
    onClearFilters,
    selectedCount,
    exportFilename = "reporte",
    onExport,
    onExportCsv,
    onRefresh,
    loading,
    className,
}: TableToolbarProps) {
    const [exporting, setExporting] = React.useState(false)

    async function handleExport(format: "excel" | "pdf") {
        if (!onExport || exporting) return
        setExporting(true)
        try {
            const result = await onExport(format)
            if (result instanceof Blob) {
                const extension = format === "excel" ? "xlsx" : "pdf"
                const baseName = exportFilename.replace(/\.[^/.]+$/, "")
                const blobUrl = window.URL.createObjectURL(result)
                const link = document.createElement("a")
                link.href = blobUrl
                link.download = `${baseName}.${extension}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(blobUrl)
            }
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-3", className)}>
            <div className="relative max-w-sm min-w-48 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className="h-10 rounded-xl pl-9 bg-background/60 backdrop-blur-sm border-muted/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                />
            </div>
            {hasActiveFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={onClearFilters} className="gap-1.5">
                    <X className="size-3.5" aria-hidden />
                    Limpiar filtros
                </Button>
            )}
            {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {selectedCount} seleccionado(s)
                </span>
            )}
            <div className="ml-auto flex items-center gap-2">
                {onRefresh && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={loading}
                        onClick={onRefresh}
                        title="Recargar datos"
                    >
                        <RotateCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
                        <span className="hidden sm:inline">Recargar</span>
                    </Button>
                )}
                {onExport ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={exporting}
                                />
                            }
                        >
                            {exporting ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                                <Download className="size-4" aria-hidden />
                            )}
                            {exporting ? "Exportando…" : "Exportar"}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleExport("excel")} disabled={exporting}>
                                <FileSpreadsheet className="size-4" aria-hidden />
                                Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport("pdf")} disabled={exporting}>
                                <FileText className="size-4" aria-hidden />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : onExportCsv ? (
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onExportCsv}>
                        <Download className="size-4" aria-hidden />
                        Exportar CSV
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
