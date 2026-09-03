"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, NumericField } from "@/components/form";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/combobox";
import { create, update } from "@/lib/api/batches";
import type { IBatch, IBatchRequest } from "@/lib/types/batch";
import type { Medicamento } from "@/lib/types";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

// Esquema de validación con Zod para Lotes
const batchSchema = z.object({
  medicament_id: z.coerce.number().min(1, "Selecciona un medicamento."),
  batch_number: z.string().trim().min(1, "El número de lote es obligatorio."),
  expiration_date: z.string().min(1, "La fecha de vencimiento es obligatoria."),
  current_quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa."),
  purchase_price: z.coerce.number().min(0.01, "El precio de compra debe ser mayor a 0."),
});

type BatchFormValues = z.infer<typeof batchSchema>;

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: IBatch | null;
  medicamentos: Medicamento[];
  onSaved?: (batch?: IBatch) => void;
}

function BatchFormBody({
  open,
  onOpenChange,
  batch,
  medicamentos,
  onSaved,
}: BatchFormDialogProps) {
  const isEditing = Boolean(batch);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      medicament_id: batch?.medicament_id ?? (medicamentos[0]?.id_medicamento || 0),
      batch_number: batch?.batch_number ?? "",
      expiration_date: batch?.expiration_date ? batch.expiration_date.slice(0, 10) : "",
      current_quantity: batch ? Number(batch.current_quantity) : 1,
      purchase_price: batch ? Number(batch.purchase_price) : 0,
    },
  });

  const {
    handleSubmit,
    control,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: BatchFormValues) {
    setServerError(null);

    const payload: IBatchRequest = {
      medicament_id: data.medicament_id,
      batch_number: data.batch_number.trim(),
      expiration_date: data.expiration_date,
      current_quantity: data.current_quantity,
      purchase_price: data.purchase_price,
    };

    try {
      const response = batch
        ? await update(batch.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<BatchFormValues>(err, setError, setFocus);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el lote.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Lote", edit: "Editar Lote" }}
      description={{
        create: "Registra un nuevo lote de medicamento con su cantidad inicial.",
        edit: "Actualiza la información del lote seleccionado.",
      }}
      submitLabel={{ create: "Crear Lote", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="medicament_id">Medicamento</Label>
          <Controller
            name="medicament_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={medicamentos.map((m) => ({
                  value: String(m.id_medicamento),
                  label: m.nombre,
                  sublabel: m.codigo ? `Código: ${m.codigo}` : undefined,
                }))}
                value={field.value ? String(field.value) : undefined}
                onValueChange={(val) => field.onChange(Number(val))}
                disabled={isEditing}
                placeholder="Selecciona un medicamento…"
                searchPlaceholder="Buscar medicamento…"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="batch_number"
            label="N° de Lote"
            required
            placeholder="Ej. LOT-2026-X1"
            autoFocus
          />
          <InputTextField
            name="expiration_date"
            label="Fecha de Vencimiento"
            required
            type="date"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isEditing && (
            <NumericField
              name="current_quantity"
              label="Cantidad Inicial"
              placeholder="Ej. 100"
            />
          )}
          <NumericField
            name="purchase_price"
            label="Precio de Compra (Bs)"
            allowDecimal
            placeholder="Ej. 8.50"
          />
        </div>
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar lotes
export function BatchFormDialog({
  open,
  onOpenChange,
  batch,
  medicamentos,
  onSaved,
}: BatchFormDialogProps) {
  if (!open) return null;

  return (
    <BatchFormBody
      key={batch ? `edit-${batch.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      batch={batch}
      medicamentos={medicamentos}
      onSaved={onSaved}
    />
  );
}

// Alias de compatibilidad
export const LoteFormDialog = BatchFormDialog;
