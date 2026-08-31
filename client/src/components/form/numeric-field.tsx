"use client";

import * as React from "react";
import { useFormContext, Controller, get } from "react-hook-form";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface NumericFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  allowDecimal?: boolean;
  maxDigits?: number;
}

export function NumericField({
  name,
  label,
  helperText,
  required,
  placeholder,
  disabled,
  className,
  containerClassName,
  allowDecimal,
  maxDigits,
}: NumericFieldProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const error = get(errors, name);
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <Label htmlFor={name} className={cn(errorMessage && "text-destructive")}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <NumericInput
            id={name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled || isSubmitting}
            placeholder={placeholder}
            allowDecimal={allowDecimal}
            maxDigits={maxDigits}
            className={cn(
              errorMessage && "border-destructive focus-visible:ring-destructive",
              className
            )}
          />
        )}
      />
      {errorMessage ? (
        <span className="text-xs text-destructive">{errorMessage}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}
