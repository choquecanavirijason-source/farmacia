"use client";

import * as React from "react";
import { useFormContext, get } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface InputTextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  name: string;
  label?: string;
  helperText?: string;
  containerClassName?: string;
}

export function InputTextField({
  name,
  label,
  helperText,
  containerClassName,
  className,
  required,
  ...props
}: InputTextFieldProps) {
  const {
    register,
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
      <Input
        id={name}
        {...register(name)}
        disabled={props.disabled || isSubmitting}
        aria-invalid={Boolean(errorMessage)}
        className={cn(
          errorMessage && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
      {errorMessage ? (
        <span className="text-xs text-destructive">{errorMessage}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}
