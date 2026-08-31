"use client";

import * as React from "react";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface FormDialogProps<TFieldValues extends FieldValues = FieldValues> {
  methods?: UseFormReturn<TFieldValues>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  title?: string | { create: string; edit: string };
  description?: string | { create: string; edit: string };
  isSubmitting?: boolean;
  submitLabel?: { create?: string; edit?: string };
  cancelLabel?: string;
  loadingLabel?: string;
  serverError?: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FormDialog<TFieldValues extends FieldValues = FieldValues>({
  methods,
  open,
  onOpenChange,
  isEditing = false,
  title,
  description,
  isSubmitting = false,
  submitLabel = { create: "Guardar", edit: "Guardar cambios" },
  cancelLabel = "Cancelar",
  loadingLabel = "Guardando…",
  serverError,
  onSubmit,
  children,
  className,
  contentClassName = "sm:max-w-lg",
}: FormDialogProps<TFieldValues>) {
  const resolvedTitle =
    typeof title === "object"
      ? isEditing
        ? title.edit
        : title.create
      : title ?? (isEditing ? "Editar registro" : "Nuevo registro");

  const resolvedDescription =
    typeof description === "object"
      ? isEditing
        ? description.edit
        : description.create
      : description ??
        (isEditing
          ? "Actualiza los datos del registro seleccionado."
          : "Ingresa la información requerida para completar el registro.");

  const resolvedSubmitText = isEditing
    ? (submitLabel?.edit ?? "Guardar cambios")
    : (submitLabel?.create ?? "Crear");

  const formContent = (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-4", className)}>
      {children}

      {serverError ? (
        <p role="alert" className="text-sm wrap-break-word text-destructive">
          {serverError}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {loadingLabel}
            </>
          ) : (
            resolvedSubmitText
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          {resolvedDescription ? (
            <DialogDescription>{resolvedDescription}</DialogDescription>
          ) : null}
        </DialogHeader>

        {methods ? (
          <FormProvider {...methods}>{formContent}</FormProvider>
        ) : (
          formContent
        )}
      </DialogContent>
    </Dialog>
  );
}
