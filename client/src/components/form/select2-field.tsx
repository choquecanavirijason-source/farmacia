"use client";

import * as React from "react";
import { useFormContext, Controller, get } from "react-hook-form";
import Select, { type Props as ReactSelectProps, type GroupBase } from "react-select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface Select2Option {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface Select2FieldProps
  extends Omit<
    ReactSelectProps<Select2Option, boolean, GroupBase<Select2Option>>,
    "name" | "value" | "onChange"
  > {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  options: Select2Option[];
  placeholder?: string;
  isClearable?: boolean;
  isMulti?: boolean;
  disabled?: boolean;
}

export function Select2Field({
  name,
  label,
  helperText,
  required,
  containerClassName,
  className,
  options,
  placeholder = "Selecciona una opción...",
  isClearable = false,
  isMulti = false,
  disabled,
  ...props
}: Select2FieldProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const error = get(errors, name);
  const errorMessage = error?.message as string | undefined;
  const isSelectDisabled = disabled || props.isDisabled || isSubmitting;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <Label htmlFor={name} className={cn("text-xs font-semibold", errorMessage && "text-destructive")}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Valor formateado para react-select
          let selectedValue: any = null;
          if (isMulti) {
            const raw = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
            selectedValue = options.filter((opt) => raw.includes(opt.value));
          } else {
            selectedValue = options.find((opt) => String(opt.value) === String(field.value)) || null;
          }

          return (
            <Select<Select2Option, boolean>
              inputId={name}
              value={selectedValue}
              options={options}
              isDisabled={isSelectDisabled}
              isClearable={isClearable}
              isMulti={isMulti}
              placeholder={placeholder}
              noOptionsMessage={() => "No se encontraron opciones"}
              loadingMessage={() => "Cargando..."}
              onChange={(val: any) => {
                if (isMulti) {
                  const arr = val ? val.map((v: Select2Option) => v.value) : [];
                  field.onChange(arr);
                } else {
                  field.onChange(val ? val.value : "");
                }
              }}
              onBlur={field.onBlur}
              formatOptionLabel={(option) => (
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="font-medium text-xs truncate">{option.label}</span>
                  </div>
                  {option.sublabel && (
                    <span className="text-[11px] text-muted-foreground shrink-0">{option.sublabel}</span>
                  )}
                </div>
              )}
              classNames={{
                control: ({ isFocused, isDisabled }) =>
                  cn(
                    "flex min-h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs transition-colors",
                    isFocused && "border-ring ring-1 ring-ring outline-hidden",
                    errorMessage && "border-destructive focus-visible:ring-destructive",
                    isDisabled && "cursor-not-allowed opacity-50 bg-muted/30"
                  ),
                placeholder: () => "text-xs text-muted-foreground font-normal",
                singleValue: () => "text-xs text-foreground font-medium",
                multiValue: () =>
                  "bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px] font-medium mr-1 flex items-center gap-1",
                multiValueLabel: () => "text-primary text-[11px]",
                multiValueRemove: () => "hover:bg-primary/20 rounded p-0.5 text-primary",
                input: () => "text-xs text-foreground",
                menu: () =>
                  "z-50 my-1 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden",
                menuList: () => "p-1 text-xs max-h-60 overflow-y-auto divide-y divide-border/20",
                option: ({ isFocused, isSelected }) =>
                  cn(
                    "rounded-sm px-2.5 py-1.5 text-xs cursor-pointer transition-colors",
                    isFocused && !isSelected && "bg-accent text-accent-foreground",
                    isSelected && "bg-primary text-primary-foreground font-medium",
                    !isFocused && !isSelected && "hover:bg-accent/50"
                  ),
                noOptionsMessage: () => "p-2.5 text-xs text-muted-foreground text-center",
              }}
              unstyled
              {...props}
            />
          );
        }}
      />

      {errorMessage ? (
        <span className="text-xs font-medium text-destructive">{errorMessage}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}
