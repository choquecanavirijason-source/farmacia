"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, NumericField } from "@/components/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { create, update } from "@/lib/api/medicaments";
import type { IMedicament, IMedicamentRequest } from "@/lib/types/medicament";
import type { Categoria, Laboratorio, Presentacion } from "@/lib/types";

// Esquema de validación con Zod para Medicamentos
const medicamentSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio."),
  name: z.string().trim().min(1, "El nombre del medicamento es obligatorio."),
  concentration: z.string().trim().min(1, "La concentración es obligatoria."),
  category_id: z.coerce.number().min(1, "Selecciona una categoría."),
  presentation_id: z.coerce.number().min(1, "Selecciona una presentación."),
  laboratory_id: z.coerce.number().min(1, "Selecciona un laboratorio."),
  price: z.coerce.number().min(0.01, "El precio debe ser mayor a 0."),
  min_stock: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo."),
  requires_prescription: z.boolean(),
  status: z.enum(["active", "inactive"]),
});

type MedicamentFormValues = z.infer<typeof medicamentSchema>;

interface MedicamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicament?: IMedicament | null;
  categorias: Categoria[];
  presentaciones: Presentacion[];
  laboratorios: Laboratorio[];
  onSaved?: (medicament?: any) => void;
}

function MedicamentFormBody({
  open,
  onOpenChange,
  medicament,
  categorias,
  presentaciones,
  laboratorios,
  onSaved,
}: MedicamentFormDialogProps) {
  const isEditing = Boolean(medicament);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<MedicamentFormValues>({
    resolver: zodResolver(medicamentSchema),
    defaultValues: {
      code: medicament?.code ?? "",
      name: medicament?.name ?? "",
      concentration: medicament?.concentration ?? "",
      category_id: medicament?.category_id ?? (categorias[0]?.id_categoria || 0),
      presentation_id: medicament?.presentation_id ?? (presentaciones[0]?.id_presentacion || 0),
      laboratory_id: medicament?.laboratory_id ?? (laboratorios[0]?.id_laboratorio || 0),
      price: medicament ? Number(medicament.price) : 0,
      min_stock: medicament ? Number(medicament.min_stock) : 0,
      requires_prescription: Boolean(medicament?.requires_prescription),
      status: medicament?.status ?? "active",
    },
  });

  const {
    handleSubmit,
    control,
    setError,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: MedicamentFormValues) {
    setServerError(null);

    const payload: IMedicamentRequest = {
      code: data.code.trim(),
      name: data.name.trim(),
      concentration: data.concentration.trim(),
      category_id: data.category_id,
      presentation_id: data.presentation_id,
      laboratory_id: data.laboratory_id,
      price: data.price,
      min_stock: data.min_stock,
      requires_prescription: data.requires_prescription,
      status: data.status,
    };

    try {
      const response = medicament
        ? await update(medicament.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.keys(fieldErrors).forEach((key) => {
          const field = key as keyof MedicamentFormValues;
          const msg = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
          setError(field, { type: "server", message: msg });
        });
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el medicamento.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Medicamento", edit: "Editar Medicamento" }}
      description={{
        create: "Completa los campos para registrar un nuevo medicamento.",
        edit: "Actualiza la información del medicamento en el catálogo.",
      }}
      submitLabel={{ create: "Crear Medicamento", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="code"
            label="Código / Barras"
            required
            placeholder="Ej. MED-0012"
            autoFocus
          />
          <InputTextField
            name="concentration"
            label="Concentración"
            required
            placeholder="Ej. 500 mg, 10 mg/5 ml"
          />
        </div>

        <InputTextField
          name="name"
          label="Nombre Comercial / Genérico"
          required
          placeholder="Ej. Paracetamol, Ibuprofeno"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category_id">Categoría</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger id="category_id" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="presentation_id">Presentación</Label>
            <Controller
              name="presentation_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger id="presentation_id" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {presentaciones.map((p) => (
                      <SelectItem key={p.id_presentacion} value={String(p.id_presentacion)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="laboratory_id">Laboratorio</Label>
            <Controller
              name="laboratory_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger id="laboratory_id" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {laboratorios.map((l) => (
                      <SelectItem key={l.id_laboratorio} value={String(l.id_laboratorio)}>
                        {l.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            name="price"
            label="Precio de Venta (Bs)"
            allowDecimal
            placeholder="Ej. 15.50"
          />
          <NumericField
            name="min_stock"
            label="Stock Mínimo"
            placeholder="Ej. 10"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-3">
            <Controller
              name="requires_prescription"
              control={control}
              render={({ field }) => (
                <Switch
                  id="requires_prescription"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="requires_prescription" className="font-normal cursor-pointer text-xs">
              Requiere receta médica
            </Label>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <Label htmlFor="status" className="text-xs">Estado:</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="status" className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </div>
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar medicamentos
export function MedicamentFormDialog({
  open,
  onOpenChange,
  medicament,
  categorias,
  presentaciones,
  laboratorios,
  onSaved,
}: MedicamentFormDialogProps) {
  return (
    <MedicamentFormBody
      key={medicament ? `edit-${medicament.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      medicament={medicament}
      categorias={categorias}
      presentaciones={presentaciones}
      laboratorios={laboratorios}
      onSaved={onSaved}
    />
  );
}

// Alias de compatibilidad
export const MedicamentoFormDialog = MedicamentFormDialog;
