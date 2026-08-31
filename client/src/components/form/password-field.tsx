"use client";

import * as React from "react";
import { useFormContext, get } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type"> {
  name: string;
  label?: string;
  helperText?: string;
  containerClassName?: string;
}

export function PasswordField({
  name,
  label,
  helperText,
  containerClassName,
  className,
  required,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
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
      <div className="relative">
        <Input
          id={name}
          type={showPassword ? "text" : "password"}
          {...register(name)}
          disabled={props.disabled || isSubmitting}
          aria-invalid={Boolean(errorMessage)}
          className={cn(
            "pr-10",
            errorMessage && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={props.disabled || isSubmitting}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {showPassword ? (
            <EyeOff className="size-4.5" aria-hidden />
          ) : (
            <Eye className="size-4.5" aria-hidden />
          )}
        </button>
      </div>
      {errorMessage ? (
        <span className="text-xs text-destructive">{errorMessage}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}
