"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField } from "@/components/form";
import { create, update } from "@/lib/api/laboratories";
import type { ILaboratory, ILaboratoryRequest } from "@/lib/types/laboratory";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

// Esquema de validación con Zod para Laboratorios
const laboratorySchema = z.object({
  name: z.string().trim().min(1, "El nombre del laboratorio es obligatorio."),
  country: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
});

type LaboratoryFormValues = z.infer<typeof laboratorySchema>;

interface LaboratoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratory?: ILaboratory | null;
  onSaved?: (laboratory?: ILaboratory) => void;
}

function LaboratoryFormBody({
  open,
  onOpenChange,
  laboratory,
  onSaved,
}: LaboratoryFormDialogProps) {
  const isEditing = Boolean(laboratory);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<LaboratoryFormValues>({
    resolver: zodResolver(laboratorySchema),
    defaultValues: {
      name: laboratory?.name ?? "",
      country: laboratory?.country ?? "",
      phone: laboratory?.phone ?? "",
    },
  });

  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: LaboratoryFormValues) {
    setServerError(null);

    const payload: ILaboratoryRequest = {
      name: data.name.trim(),
      country: data.country ? data.country.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
    };

    try {
      const response = laboratory
        ? await update(laboratory.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<LaboratoryFormValues>(err, setError, setFocus);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el laboratorio.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Laboratorio", edit: "Editar Laboratorio" }}
      description={{
        create: "Completa los campos para registrar un nuevo laboratorio en el catálogo.",
        edit: "Actualiza la información del laboratorio seleccionado.",
      }}
      submitLabel={{ create: "Crear Laboratorio", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <InputTextField
          name="name"
          label="Nombre del Laboratorio"
          required
          placeholder="Ej. Bayer, Pfizer, Bagó"
          autoFocus
        />
        <InputTextField
          name="country"
          label="País de Origen"
          placeholder="Ej. Alemania, Bolivia, Argentina"
        />
        <InputTextField
          name="phone"
          label="Teléfono de Contacto"
          placeholder="Ej. +591 2 2445566"
        />
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar laboratorios
export function LaboratoryFormDialog({
  open,
  onOpenChange,
  laboratory,
  onSaved,
}: LaboratoryFormDialogProps) {
  if (!open) return null;

  return (
    <LaboratoryFormBody
      key={laboratory ? `edit-${laboratory.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      laboratory={laboratory}
      onSaved={onSaved}
    />
  );
}
