"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, NumericField } from "@/components/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  create,
  update,
  fetchCategorias,
  fetchPresentaciones,
  fetchLaboratorios,
} from "@/lib/api/medicaments";
import type { IMedicament, IMedicamentRequest } from "@/lib/types/medicament";
import type { Categoria, Laboratorio, Presentacion } from "@/lib/types";

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
  categorias?: Categoria[];
  presentaciones?: Presentacion[];
  laboratorios?: Laboratorio[];
  onSaved?: (medicament?: any) => void;
}

function MedicamentFormBody({
  open,
  onOpenChange,
  medicament,
  categorias: initialCategorias,
  presentaciones: initialPresentaciones,
  laboratorios: initialLaboratorios,
  onSaved,
}: MedicamentFormDialogProps) {
  const isEditing = Boolean(medicament);
  const [serverError, setServerError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias || []);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>(initialPresentaciones || []);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>(initialLaboratorios || []);

  useEffect(() => {
    if (!initialCategorias || initialCategorias.length === 0) {
      fetchCategorias().then(setCategorias).catch(() => setCategorias([]));
    }
    if (!initialPresentaciones || initialPresentaciones.length === 0) {
      fetchPresentaciones().then(setPresentaciones).catch(() => setPresentaciones([]));
    }
    if (!initialLaboratorios || initialLaboratorios.length === 0) {
      fetchLaboratorios().then(setLaboratorios).catch(() => setLaboratorios([]));
    }
  }, [initialCategorias, initialPresentaciones, initialLaboratorios]);

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
          const msg = Array.isArray(fieldErrors[key])
            ? fieldErrors[key][0]
            : fieldErrors[key];
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

  const categoryOptions = categorias.map((c) => ({
    value: String(c.id_categoria || c.id),
    label: c.nombre || c.name,
  }));

  const presentationOptions = presentaciones.map((p) => ({
    value: String(p.id_presentacion || p.id),
    label: p.nombre || p.name,
  }));

  const laboratoryOptions = laboratorios.map((l) => ({
    value: String(l.id_laboratorio || l.id),
    label: l.nombre || l.name,
  }));

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Medicamento", edit: "Editar Medicamento" }}
      description={{
        create: "Ingresa los datos generales, clasificación y precio de venta del medicamento.",
        edit: "Modifica la información o estado del medicamento seleccionado.",
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
            label="Código / Código de Barras"
            required
            placeholder="Ej. MED-001"
            autoFocus
          />
          <InputTextField
            name="name"
            label="Nombre del Medicamento"
            required
            placeholder="Ej. Paracetamol"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="concentration"
            label="Concentración"
            required
            placeholder="Ej. 500mg, 1g / 5ml"
          />
          <Controller
            control={control}
            name="category_id"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category_id">
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <SearchableSelect
                  options={categoryOptions}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(val ? Number(val) : 0)}
                  placeholder="Seleccionar categoría…"
                  searchPlaceholder="Buscar categoría…"
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="presentation_id"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="presentation_id">
                  Presentación <span className="text-destructive">*</span>
                </Label>
                <SearchableSelect
                  options={presentationOptions}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(val ? Number(val) : 0)}
                  placeholder="Seleccionar presentación…"
                  searchPlaceholder="Buscar presentación…"
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            control={control}
            name="laboratory_id"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="laboratory_id">
                  Laboratorio <span className="text-destructive">*</span>
                </Label>
                <SearchableSelect
                  options={laboratoryOptions}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(val ? Number(val) : 0)}
                  placeholder="Seleccionar laboratorio…"
                  searchPlaceholder="Buscar laboratorio…"
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            name="price"
            label="Precio de Venta (Bs)"
            required
            allowDecimal={true}
            placeholder="0.00"
          />
          <NumericField
            name="min_stock"
            label="Stock Mínimo de Alerta"
            required
            allowDecimal={false}
            placeholder="10"
          />
        </div>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Controller
            control={control}
            name="requires_prescription"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch
                  id="requires_prescription"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="requires_prescription" className="cursor-pointer text-xs">
                  Requiere Receta Médica
                </Label>
              </div>
            )}
          />

          {isEditing && (
            <div className="flex items-center gap-2">
              <Label htmlFor="status" className="text-xs">Estado:</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 w-28 text-xs">
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

export function MedicamentFormDialog({
  open,
  onOpenChange,
  medicament,
  categorias,
  presentaciones,
  laboratorios,
  onSaved,
}: MedicamentFormDialogProps) {
  if (!open) return null;

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

export const MedicamentoFormDialog = MedicamentFormDialog;
