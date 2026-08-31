"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, TextAreaField } from "@/components/form";
import { create, update } from "@/lib/api/categories";
import type { ICategory, ICategoryRequest } from "@/lib/types/category";

// Esquema de validación con Zod para Categorías
const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la categoría es obligatorio."),
  description: z.string().trim().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ICategory | null;
  onSaved?: (category?: ICategory) => void;
}

function CategoryFormBody({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormDialogProps) {
  const isEditing = Boolean(category);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
    },
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: CategoryFormValues) {
    setServerError(null);

    const payload: ICategoryRequest = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
    };

    try {
      const response = category
        ? await update(category.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.keys(fieldErrors).forEach((key) => {
          const field = key as keyof CategoryFormValues;
          const msg = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
          setError(field, { type: "server", message: msg });
        });
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar la categoría.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nueva Categoría", edit: "Editar Categoría" }}
      description={{
        create: "Completa los campos para registrar una nueva categoría en el catálogo.",
        edit: "Actualiza la información de la categoría seleccionada.",
      }}
      submitLabel={{ create: "Crear Categoría", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <InputTextField
          name="name"
          label="Nombre de la Categoría"
          required
          placeholder="Ej. Analgésicos"
          autoFocus
        />
        <TextAreaField
          name="description"
          label="Descripción"
          placeholder="Descripción opcional de la categoría..."
        />
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar categorías
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormDialogProps) {
  return (
    <CategoryFormBody
      key={category ? `edit-${category.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      category={category}
      onSaved={onSaved}
    />
  );
}
