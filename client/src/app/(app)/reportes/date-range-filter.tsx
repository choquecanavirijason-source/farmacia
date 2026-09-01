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
}: DateRangeFilterProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onApply();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="size-3.5" />
        <span className="font-medium">Periodo:</span>
      </div>

      <Select value={preset} onValueChange={(val) => val && onPresetChange(val)}>
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
