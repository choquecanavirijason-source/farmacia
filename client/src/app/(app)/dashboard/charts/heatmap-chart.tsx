"use client";

import type { ApexOptions } from "apexcharts";
import ApexChart from "./apex-chart";
import { useApexBaseOptions, CHART_PALETTE } from "./chart-theme";

interface HeatmapChartProps {
  data: { day: string; horas: number[] }[];
  formatValue?: (value: number) => string;
  height?: number;
}

/** Mapa de calor de ventas por hora del día × día de la semana (últimos 30 días). */
export function HeatmapChart({ data, formatValue, height = 300 }: HeatmapChartProps) {
  const base = useApexBaseOptions();
  const fmt = formatValue ?? ((v: number) => String(v));

  const series = data.map((d) => ({
    name: d.day,
    data: d.horas.map((v, h) => ({ x: `${h}h`, y: Math.round(v) })),
  }));

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "heatmap", height },
    colors: [CHART_PALETTE[0]],
    dataLabels: { enabled: false },
    xaxis: {
      type: "category",
      labels: { style: { colors: base.chart?.foreColor as string, fontSize: "10px" } },
    },
    yaxis: {
      labels: { style: { colors: base.chart?.foreColor as string } },
    },
    plotOptions: {
      heatmap: {
        radius: 3,
        shadeIntensity: 0.6,
        colorScale: {
          ranges: [{ from: 0, to: 0, color: base.theme?.mode === "dark" ? "#1e293b" : "#f1f5f9", name: "Sin ventas" }],
        },
      },
    },
    tooltip: { ...base.tooltip, y: { formatter: fmt } },
  };

  return <ApexChart type="heatmap" height={height} series={series} options={options} />;
}
