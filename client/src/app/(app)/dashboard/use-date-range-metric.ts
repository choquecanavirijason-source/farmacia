"use client";

import { useEffect, useState } from "react";
import { useBranchView } from "@/context/branch-view-context";
import type { DashboardFilterParams } from "@/lib/api/dashboard";
import type { DateRangeFilterProps } from "@/app/(app)/reportes/types";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

/** Cada gráfico con rango de fechas propio usa este hook: mantiene su propio preset/fechas
 * y hace su propia llamada al backend, en vez de depender de un filtro global de la vista. */
export function useDateRangeMetric<T>(
  fetchFn: (filters: DashboardFilterParams, signal?: AbortSignal) => Promise<T>,
  defaultPreset: "7dias" | "30dias" = "7dias"
) {
  const { branchScope } = useBranchView();
  const initialStart = defaultPreset === "30dias" ? getDaysAgo(29) : getDaysAgo(6);

  const [preset, setPreset] = useState<string>(defaultPreset);
  const [tempStartDate, setTempStartDate] = useState(initialStart);
  const [tempEndDate, setTempEndDate] = useState(getToday());
  const [appliedStartDate, setAppliedStartDate] = useState(initialStart);
  const [appliedEndDate, setAppliedEndDate] = useState(getToday());

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function handlePresetChange(val: string) {
    setPreset(val);
    if (val === "hoy") {
      setTempStartDate(getToday());
      setTempEndDate(getToday());
    } else if (val === "7dias") {
      setTempStartDate(getDaysAgo(6));
      setTempEndDate(getToday());
    } else if (val === "30dias") {
      setTempStartDate(getDaysAgo(29));
      setTempEndDate(getToday());
    } else if (val === "mes") {
      setTempStartDate(getMonthStart());
      setTempEndDate(getToday());
    }
  }

  function handleApply() {
    setAppliedStartDate(tempStartDate);
    setAppliedEndDate(tempEndDate);
  }

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setIsLoading(true);

    fetchFn(
      {
        start_date: appliedStartDate,
        end_date: appliedEndDate,
        ...(branchScope ? { branch_id: branchScope } : {}),
      },
      controller.signal
    )
      .then((result) => {
        if (alive) setData(result);
      })
      .catch(() => {
        // Fallback controlado
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedStartDate, appliedEndDate, branchScope]);

  const filterProps: DateRangeFilterProps = {
    preset,
    startDate: tempStartDate,
    endDate: tempEndDate,
    onPresetChange: handlePresetChange,
    onStartDateChange: setTempStartDate,
    onEndDateChange: setTempEndDate,
    onApply: handleApply,
    isLoading,
  };

  return { data, isLoading, filterProps };
}
