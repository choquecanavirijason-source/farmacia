"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, TextAreaField } from "@/components/form";
import { create, update } from "@/lib/api/presentations";
import type { IPresentation, IPresentationRequest } from "@/lib/types/presentation";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

// Esquema de validación con Zod para Presentaciones
const presentationSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la presentación es obligatorio."),
  description: z.string().trim().nullable().optional(),
});

type PresentationFormValues = z.infer<typeof presentationSchema>;

interface PresentationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentation?: IPresentation | null;
  onSaved?: (presentation?: IPresentation) => void;
}

function PresentationFormBody({
  open,
  onOpenChange,
  presentation,
  onSaved,
}: PresentationFormDialogProps) {
  const isEditing = Boolean(presentation);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<PresentationFormValues>({
    resolver: zodResolver(presentationSchema),
    defaultValues: {
      name: presentation?.name ?? "",
      description: presentation?.description ?? "",
    },
  });

  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: PresentationFormValues) {
    setServerError(null);

    const payload: IPresentationRequest = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
    };

    try {
      const response = presentation
        ? await update(presentation.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<PresentationFormValues>(err, setError, setFocus);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar la presentación.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nueva Presentación", edit: "Editar Presentación" }}
      description={{
        create: "Completa los campos para registrar una nueva presentación en el catálogo.",
        edit: "Actualiza la información de la presentación seleccionada.",
      }}
      submitLabel={{ create: "Crear Presentación", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <InputTextField
          name="name"
          label="Nombre de la Presentación"
          required
          placeholder="Ej. Comprimidos, Jarabe, Ampollas"
          autoFocus
        />
        <TextAreaField
          name="description"
          label="Descripción"
          placeholder="Descripción opcional de la forma farmacéutica..."
        />
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar presentaciones
export function PresentationFormDialog({
  open,
  onOpenChange,
  presentation,
  onSaved,
}: PresentationFormDialogProps) {
  return (
    <PresentationFormBody
      key={presentation ? `edit-${presentation.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      presentation={presentation}
      onSaved={onSaved}
    />
  );
}
