"use client";

import type { RefObject } from "react";
import type { ApexOptions } from "apexcharts";
import ApexChart from "./apex-chart";
import { useApexBaseOptions, CHART_PALETTE } from "./chart-theme";
import type { ApexChartInstance } from "./chart-card";

interface ComboChartProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  formatValue?: (value: number) => string;
  height?: number;
  chartRef?: RefObject<ApexChartInstance>;
}

/** Barras agrupadas — usado para Compras vs. Ventas por mes. */
export function ComboChart({ categories, series, formatValue, height = 320, chartRef }: ComboChartProps) {
  const base = useApexBaseOptions();
  const fmt = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "bar", height },
    colors: [CHART_PALETTE[1], CHART_PALETTE[0]],
    plotOptions: {
      bar: { columnWidth: "55%", borderRadius: 4, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
      labels: { style: { colors: base.chart?.foreColor as string } },
    },
    yaxis: {
      labels: { style: { colors: base.chart?.foreColor as string }, formatter: fmt },
    },
    tooltip: { ...base.tooltip, y: { formatter: fmt } },
    legend: { ...base.legend, position: "top" },
  };

  return <ApexChart type="bar" height={height} series={series} options={options} chartRef={chartRef} />;
}
