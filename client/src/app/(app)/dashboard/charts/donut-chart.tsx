"use client";

import type { ApexOptions } from "apexcharts";
import ApexChart from "./apex-chart";
import { useApexBaseOptions, CHART_PALETTE } from "./chart-theme";

interface DonutChartProps {
  labels: string[];
  series: number[];
  colors?: string[];
  formatValue?: (value: number) => string;
  height?: number;
}

/** Donut genérico — usado para método de pago, categorías, semáforo de vencimiento y proveedores. */
export function DonutChart({ labels, series, colors, formatValue, height = 300 }: DonutChartProps) {
  const base = useApexBaseOptions();
  const fmt = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "donut", height },
    labels,
    colors: colors ?? CHART_PALETTE,
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
    tooltip: {
      ...base.tooltip,
      y: { formatter: fmt, title: { formatter: (seriesName: string) => seriesName } },
      // El Card padre usa overflow-hidden (bordes redondeados); un tooltip que sigue
      // al cursor se recorta cerca de los bordes. Se fija en una esquina para evitarlo.
      fixed: { enabled: true, position: "topRight" },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: { show: false },
        },
      },
    },
  };

  return <ApexChart type="donut" height={height} series={series} options={options} />;
}
