"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Props as ApexChartProps } from "react-apexcharts";

// react-apexcharts toca `window` al montar; con output:"export" no hay SSR real,
// pero Next igual prerenderiza en build, así que se carga solo en cliente.
const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}) as ComponentType<ApexChartProps>;

export default ApexChart;
