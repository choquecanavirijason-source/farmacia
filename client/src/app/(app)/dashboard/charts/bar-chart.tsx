"use client";

import type { ApexOptions } from "apexcharts";
import ApexChart from "./apex-chart";
import { useApexBaseOptions, CHART_PALETTE } from "./chart-theme";

interface BarChartProps {
  categories: string[];
  series: number[];
  seriesName?: string;
  formatValue?: (value: number) => string;
  horizontal?: boolean;
  color?: string;
  height?: number;
}

/** Barra genérica — top productos, ranking de vendedores, baja rotación, ventas por día. */
export function BarChart({
  categories,
  series,
  seriesName = "Total",
  formatValue,
  horizontal = true,
  color,
  height = 320,
}: BarChartProps) {
  const base = useApexBaseOptions();
  const fmt = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "bar", height, toolbar: { ...base.chart?.toolbar, show: true } },
    colors: [color ?? CHART_PALETTE[0]],
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        borderRadiusApplication: "end",
        distributed: false,
        barHeight: horizontal ? "65%" : undefined,
        columnWidth: horizontal ? undefined : "55%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: base.chart?.foreColor as string },
        formatter: horizontal ? fmt : undefined,
      },
    },
    yaxis: {
      labels: {
        style: { colors: base.chart?.foreColor as string },
        formatter: horizontal ? undefined : fmt,
      },
    },
    tooltip: { ...base.tooltip, y: { formatter: fmt } },
  };

  return (
    <ApexChart
      type="bar"
      height={height}
      series={[{ name: seriesName, data: series }]}
      options={options}
    />
  );
}
