"use client";

import { useTheme } from "next-themes";
import type { ApexOptions } from "apexcharts";

/** Paleta categórica del dashboard — hex fijo (ApexCharts necesita hex/rgb, no acepta oklch()). */
export const CHART_PALETTE = [
  "#2dd4bf", // teal (marca)
  "#6366f1", // indigo
  "#f59e0b", // ámbar
  "#f43f5e", // rosa
  "#0ea5e9", // celeste
  "#a855f7", // violeta
  "#84cc16", // lima
  "#64748b", // slate
];

/** Semáforo de vencimiento: vencido → saludable. */
export const SEMAFORO_PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e"];

export function useApexBaseOptions(): ApexOptions {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return {
    chart: {
      background: "transparent",
      foreColor: isDark ? "#94a3b8" : "#64748b",
      toolbar: {
        show: true,
        tools: { download: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
      },
      zoom: { enabled: true },
      animations: { enabled: true, speed: 350 },
    },
    theme: { mode: isDark ? "dark" : "light" },
    grid: {
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.07)",
      strokeDashArray: 3,
    },
    tooltip: { theme: isDark ? "dark" : "light" },
    colors: CHART_PALETTE,
    legend: { labels: { colors: isDark ? "#cbd5e1" : "#475569" } },
    dataLabels: { style: { colors: [isDark ? "#e2e8f0" : "#1e293b"] } },
  };
}
