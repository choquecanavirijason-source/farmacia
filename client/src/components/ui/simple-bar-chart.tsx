"use client";

export interface BarChartDatum {
  label: string;
  value: number;
}

const BAR_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

interface SimpleBarChartProps {
  data: BarChartDatum[];
  formatValue?: (value: number) => string;
  className?: string;
}

/** Gráfico de barras horizontal, sin dependencias — para reportes con pocos datos categóricos. */
export function SimpleBarChart({ data, formatValue = (v) => String(v), className }: SimpleBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground sm:w-36" title={d.label}>
            {d.label}
          </span>
          <div className="flex h-6 min-w-0 flex-1 items-center rounded-md bg-muted">
            <div
              className={`h-full min-w-1 rounded-md ${BAR_COLORS[i % BAR_COLORS.length]} transition-[width] duration-500 ease-out`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
            {formatValue(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
