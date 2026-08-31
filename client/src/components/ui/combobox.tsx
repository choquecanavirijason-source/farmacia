"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export interface MultiComboboxProps {
  options: ComboboxOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Select Buscable (Equivalente moderno a Select2 para React/Next.js)
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción…",
  searchPlaceholder = "Buscar…",
  emptyText = "No se encontraron resultados.",
  disabled = false,
  clearable = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  }, [options, search]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full justify-between h-9 px-3 font-normal bg-background hover:bg-background/80"
      >
        <span className={cn("truncate text-sm", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onValueChange?.("");
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-48 rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Input de Búsqueda estilo Select2 */}
          <div className="flex items-center border-b border-border/60 px-2 pb-1.5 pt-1">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Lista de Resultados */}
          <div className="max-h-56 overflow-y-auto py-1 text-xs">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      onValueChange?.(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center justify-between rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                      isSelected && "bg-accent/80 font-medium text-accent-foreground"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="size-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Select2 Multi-selección con Tags / Chips
 */
export function MultiSearchableSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Seleccionar opciones…",
  searchPlaceholder = "Buscar o filtrar…",
  emptyText = "No se encontraron resultados.",
  disabled = false,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOptions = React.useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  }, [options, search]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOption(val: string) {
    if (value.includes(val)) {
      onValueChange?.(value.filter((v) => v !== val));
    } else {
      onValueChange?.([...value, val]);
    }
  }

  function removeTag(val: string, e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange?.(value.filter((v) => v !== val));
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        role="combobox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center justify-between gap-1 rounded-md border border-input bg-background p-1.5 text-sm transition-colors cursor-pointer hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-xs text-muted-foreground px-1">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <Badge key={opt.value} variant="secondary" className="gap-1 text-[11px] py-0.5 px-2">
                <span>{opt.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeTag(opt.value, e)}
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))
          )}
        </div>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50 mr-1" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-48 rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b border-border/60 px-2 pb-1.5 pt-1">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1 text-xs">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center justify-between rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                      isSelected && "bg-primary/10 font-medium text-primary"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="size-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Aliases
export const Combobox = SearchableSelect;
export const MultiCombobox = MultiSearchableSelect;
export const Select2 = SearchableSelect;
