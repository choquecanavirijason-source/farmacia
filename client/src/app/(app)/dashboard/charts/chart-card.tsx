"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type ApexChartsClass from "apexcharts";
import {
  BarChart3,
  Maximize2,
  Minimize2,
  Menu as MenuIcon,
  Printer,
  Download,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Instancia real de ApexCharts (mismo tipo que espera `chartRef` de react-apexcharts). */
export type ApexChartInstance = ApexChartsClass | null;

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  height?: number;
  expandedHeight?: number;
  /** Filtro propio del gráfico (ej. rango de fechas) — se muestra siempre, incluso mientras carga. */
  filterSlot?: ReactNode;
  children: (height: number, chartRef: RefObject<ApexChartInstance>) => ReactNode;
}

export function ChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyMessage = "Sin datos suficientes para este gráfico todavía.",
  className,
  height = 300,
  expandedHeight,
  filterSlot,
  children,
}: ChartCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ApexChartInstance>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const canExpand = !isLoading && !isEmpty;

  // En pantalla completa el gráfico debe usar casi todo el alto real de la pantalla,
  // no un múltiplo fijo del alto chico — si no, "pantalla completa" se sentía igual
  // de apretado que el modal de antes.
  const RESERVED_CHROME_HEIGHT = 130; // título + descripción + paddings de la tarjeta
  const bigHeight = isFullscreen
    ? Math.max(viewportHeight - RESERVED_CHROME_HEIGHT, expandedHeight ?? 420)
    : (expandedHeight ?? Math.max(Math.round(height * 1.7), 420));

  const resolvedHeight = isFullscreen ? bigHeight : height;

  // Refleja el estado real de pantalla completa del navegador (incluye salir con Esc,
  // no solo con el botón), para que el gráfico no quede "atascado" en tamaño grande.
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Recalcula el alto disponible al entrar en pantalla completa y si la ventana cambia
  // de tamaño (ej. el usuario gira el dispositivo o cambia de monitor).
  useEffect(() => {
    if (!isFullscreen) return;
    function updateViewportHeight() {
      setViewportHeight(window.innerHeight);
    }
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, [isFullscreen]);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen API no disponible/permitida en este navegador: no hacer nada.
    }
  }

  function triggerDownload(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }

  // `exportToPng`/`exportToSVG` viven detrás del plugin opcional "apexcharts/features/exports"
  // (no vienen en el tipo público de la instancia); en vez de importarlo, se arma la descarga
  // a mano con lo que la instancia sí expone de forma estable: `dataURI()` para el PNG y el
  // propio SVG ya renderizado en el DOM para el SVG.
  function handleDownloadPng() {
    chartInstanceRef.current?.dataURI().then((result) => {
      if ("imgURI" in result) {
        triggerDownload(result.imgURI, `${title}.png`);
      }
    });
  }

  function handleDownloadSvg() {
    const svgEl = chartAreaRef.current?.querySelector("svg");
    if (!svgEl) return;
    const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${title}.svg`);
    URL.revokeObjectURL(url);
  }

  // Imprime solo el gráfico (su SVG), no el resto de la página: se copia el SVG ya
  // renderizado por ApexCharts a una ventana aparte y se dispara el diálogo de impresión ahí.
  function handlePrint() {
    const svgEl = chartAreaRef.current?.querySelector("svg");
    if (!svgEl) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
            h2 { margin: 0 0 16px; font-size: 16px; }
            svg { width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          ${svgEl.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onafterprint = () => printWindow.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div
      ref={containerRef}
      className={isFullscreen ? "flex h-full w-full flex-col bg-background p-6" : ""}
    >
      <Card className={`border-border/60 ${isFullscreen ? "flex h-full w-full flex-1 flex-col" : className ?? ""}`}>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
          {canExpand && (
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Opciones del gráfico"
                    />
                  }
                >
                  <MenuIcon className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={toggleFullscreen} className="cursor-pointer gap-2">
                    {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    {isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint} className="cursor-pointer gap-2">
                    <Printer className="size-3.5" />
                    Imprimir gráfico
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDownloadPng} className="cursor-pointer gap-2">
                    <FileImage className="size-3.5" />
                    Descargar PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSvg} className="cursor-pointer gap-2">
                    <Download className="size-3.5" />
                    Descargar SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => chartInstanceRef.current?.exportToCSV()}
                    className="cursor-pointer gap-2"
                  >
                    <FileSpreadsheet className="size-3.5" />
                    Descargar CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="-mt-3">
          {filterSlot && <div className="mb-3">{filterSlot}</div>}
          {isLoading ? (
            <Skeleton style={{ height }} className="w-full" />
          ) : isEmpty ? (
            <div
              className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground"
              style={{ height }}
            >
              <BarChart3 className="size-6 opacity-50" aria-hidden />
              <p className="text-xs">{emptyMessage}</p>
            </div>
          ) : (
            <div ref={chartAreaRef}>{children(resolvedHeight, chartInstanceRef)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
