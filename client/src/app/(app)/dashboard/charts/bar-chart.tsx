"use client";

import type { RefObject } from "react";
import type { ApexOptions } from "apexcharts";
import ApexChart from "./apex-chart";
import { useApexBaseOptions, CHART_PALETTE } from "./chart-theme";
import type { ApexChartInstance } from "./chart-card";

interface BarChartProps {
  categories: string[];
  series: number[];
  seriesName?: string;
  formatValue?: (value: number) => string;
  horizontal?: boolean;
  color?: string;
  height?: number;
  chartRef?: RefObject<ApexChartInstance>;
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
  chartRef,
}: BarChartProps) {
  const base = useApexBaseOptions();
  const fmt = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "bar", height },
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
      // En horizontal, el eje X es la escala de valores (Bs): con muchos ticks los números
      // se amontonan y se vuelven ilegibles en una tarjeta angosta — se limita la cantidad.
      tickAmount: horizontal ? 4 : undefined,
      labels: {
        style: { colors: base.chart?.foreColor as string, fontSize: horizontal ? "10px" : "11px" },
        formatter: horizontal ? fmt : undefined,
      },
    },
    yaxis: {
      labels: {
        style: { colors: base.chart?.foreColor as string, fontSize: horizontal ? "11px" : "12px" },
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
      chartRef={chartRef}
    />
  );
}
