"use client";

import type { ApexOptions } from "apexcharts";
import ApexChart from "./apex-chart";
import { useApexBaseOptions, CHART_PALETTE } from "./chart-theme";

interface Series {
  name: string;
  data: number[];
  color?: string;
}

interface AreaChartProps {
  categories: string[];
  series: Series[];
  formatValue?: (value: number) => string;
  height?: number;
  stacked?: boolean;
}

/** Área genérica — tendencia de ventas y margen bruto (soporta múltiples series). */
export function AreaChart({ categories, series, formatValue, height = 320, stacked = false }: AreaChartProps) {
  const base = useApexBaseOptions();
  const fmt = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    ...base,
    chart: {
      ...base.chart,
      type: "area",
      height,
      stacked,
    },
    colors: series.map((s, i) => s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]),
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.35, opacityTo: 0.02, shadeIntensity: 1 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { colors: base.chart?.foreColor as string }, rotate: -35 },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { colors: base.chart?.foreColor as string }, formatter: fmt },
    },
    tooltip: { ...base.tooltip, y: { formatter: fmt } },
    legend: series.length > 1 ? { ...base.legend, position: "top" } : { show: false },
  };

  return (
    <ApexChart
      type="area"
      height={height}
      series={series.map((s) => ({ name: s.name, data: s.data }))}
      options={options}
    />
  );
}
