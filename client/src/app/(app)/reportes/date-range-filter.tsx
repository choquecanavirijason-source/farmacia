"use client";

import { Calendar, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRangeFilterProps } from "./types";

export function DateRangeFilter({
  startDate,
  endDate,
  preset,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  isLoading = false,
  compact = false,
}: DateRangeFilterProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onApply();
    }
  }

  if (compact) {
    const isCustom = preset === "custom";

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Select
          value={preset}
          onValueChange={(val) => val && onPresetChange(val)}
          items={[
            { value: "hoy", label: "Hoy" },
            { value: "7dias", label: "Últimos 7 días" },
            { value: "30dias", label: "Últimos 30 días" },
            { value: "mes", label: "Este mes" },
            { value: "custom", label: "Personalizado" },
          ]}
        >
          <SelectTrigger className="h-7 w-28 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoy">Hoy</SelectItem>
            <SelectItem value="7dias">Últimos 7 días</SelectItem>
            <SelectItem value="30dias">Últimos 30 días</SelectItem>
            <SelectItem value="mes">Este mes</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {isCustom && (
          <>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 w-30 text-[11px] px-1.5"
              aria-label="Desde"
            />
            <span className="text-[10px] text-muted-foreground">–</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 w-30 text-[11px] px-1.5"
              aria-label="Hasta"
            />
          </>
        )}

        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          className="h-7 w-7 shrink-0"
          onClick={onApply}
          disabled={isLoading}
          aria-label="Aplicar filtros"
          title="Aplicar filtros"
        >
          <Check className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="size-3.5" />
        <span className="font-medium">Periodo:</span>
      </div>

      <Select
        value={preset}
        onValueChange={(val) => val && onPresetChange(val)}
        items={[
          { value: "hoy", label: "Hoy" },
          { value: "7dias", label: "Últimos 7 días" },
          { value: "30dias", label: "Últimos 30 días" },
          { value: "mes", label: "Este mes" },
          { value: "custom", label: "Personalizado" },
        ]}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hoy">Hoy</SelectItem>
          <SelectItem value="7dias">Últimos 7 días</SelectItem>
          <SelectItem value="30dias">Últimos 30 días</SelectItem>
          <SelectItem value="mes">Este mes</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Calendar className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Desde:</span>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 w-36 text-xs"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Hasta:</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 w-36 text-xs"
        />
      </div>

      <Button
        type="button"
        size="sm"
        className="h-8 gap-1.5 text-xs font-medium"
        onClick={onApply}
        disabled={isLoading}
      >
        <Check className="size-3.5" />
        Aplicar Filtros
      </Button>
    </div>
  );
}
