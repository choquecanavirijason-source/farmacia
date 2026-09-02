"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, NumericField } from "@/components/form";
import { create, update } from "@/lib/api/suppliers";
import type { ISupplier, ISupplierRequest } from "@/lib/types/supplier";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

// Esquema de validación con Zod para Proveedores
const supplierSchema = z.object({
  name: z.string().trim().min(1, "El nombre o razón social es obligatorio."),
  nit: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido.")
    .or(z.literal(""))
    .nullable()
    .optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: ISupplier | null;
  onSaved?: (supplier?: ISupplier) => void;
}

function SupplierFormBody({
  open,
  onOpenChange,
  supplier,
  onSaved,
}: SupplierFormDialogProps) {
  const isEditing = Boolean(supplier);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      nit: supplier?.nit ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      email: supplier?.email ?? "",
    },
  });

  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: SupplierFormValues) {
    setServerError(null);

    const payload: ISupplierRequest = {
      name: data.name.trim(),
      nit: data.nit ? data.nit.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      address: data.address ? data.address.trim() : null,
      email: data.email ? data.email.trim() : null,
    };

    try {
      const response = supplier
        ? await update(supplier.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<SupplierFormValues>(err, setError, setFocus);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el proveedor.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Proveedor", edit: "Editar Proveedor" }}
      description={{
        create: "Completa los campos para registrar un nuevo proveedor en el sistema.",
        edit: "Actualiza la información del proveedor seleccionado.",
      }}
      submitLabel={{ create: "Crear Proveedor", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="name"
            label="Nombre / Razón Social"
            required
            placeholder="Ej. Droguería Inti S.A."
            autoFocus
          />
          <NumericField
            name="nit"
            label="NIT"
            placeholder="Ej. 1023456023"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            name="phone"
            label="Teléfono"
            placeholder="Ej. 2445566"
          />
          <InputTextField
            name="email"
            label="Correo Electrónico"
            type="email"
            placeholder="contacto@proveedor.com"
          />
        </div>

        <InputTextField
          name="address"
          label="Dirección"
          placeholder="Ej. Av. Blanco Galindo Km 5"
        />
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar proveedores
export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSaved,
}: SupplierFormDialogProps) {
  return (
    <SupplierFormBody
      key={supplier ? `edit-${supplier.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      supplier={supplier}
      onSaved={onSaved}
    />
  );
}
