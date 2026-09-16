"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, NumericField, Select2Field } from "@/components/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { create, update, assignUsers } from "@/lib/api/branches";
import { fetchUsers } from "@/lib/api/users";
import type { IBranch, IBranchRequest } from "@/lib/types/branch";
import type { IUser } from "@/lib/types/user";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

// Esquema de validación con Zod para Sucursales
const branchSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la sucursal es obligatorio."),
  address: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  status: z.enum(["active", "inactive"]),
  user_ids: z.array(z.number()).optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: IBranch | null;
  onSaved?: (branch?: IBranch) => void;
}

function BranchFormBody({
  open,
  onOpenChange,
  branch,
  onSaved,
}: BranchFormDialogProps) {
  const isEditing = Boolean(branch);
  const [serverError, setServerError] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<IUser[]>([]);

  useEffect(() => {
    fetchUsers()
      .then(setUsersList)
      .catch(() => setUsersList([]));
  }, []);

  const methods = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name ?? "",
      address: branch?.address ?? "",
      phone: branch?.phone ?? "",
      status: branch?.status ?? "active",
      user_ids: branch?.users?.map((u) => u.id) ?? [],
    },
  });

  const {
    handleSubmit,
    control,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: BranchFormValues) {
    setServerError(null);

    const payload: IBranchRequest = {
      name: data.name.trim(),
      address: data.address ? data.address.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      status: data.status,
    };

    try {
      const response = branch
        ? await update(branch.id, payload)
        : await create(payload);

      const savedBranch = response.data;
      await assignUsers(savedBranch.id, data.user_ids ?? []);

      onSaved?.(savedBranch);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<BranchFormValues>(err, setError, setFocus);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar la sucursal.";
      setServerError(message);
    }
  }

  const userOptions = usersList.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nueva Sucursal", edit: "Editar Sucursal" }}
      description={{
        create: "Completa los campos para registrar una nueva sucursal en el sistema.",
        edit: "Actualiza la información y los usuarios asignados a la sucursal.",
      }}
      submitLabel={{ create: "Crear Sucursal", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <InputTextField
              name="name"
              label="Nombre de la Sucursal"
              required
              placeholder="Ej. Sucursal Norte"
              autoFocus
            />
          </div>
          {isEditing && (
            <div className="flex items-center gap-2 pt-6">
              <Label htmlFor="status" className="text-xs">Estado:</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={[
                      { value: "active", label: "Activa" },
                      { value: "inactive", label: "Inactiva" },
                    ]}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            name="phone"
            label="Teléfono"
            placeholder="Ej. 2445566"
          />
          <InputTextField
            name="address"
            label="Dirección"
            placeholder="Ej. Av. Blanco Galindo Km 5"
          />
        </div>

        <div className="w-full">
          <Select2Field
            name="user_ids"
            label="Usuarios Asignados a esta Sucursal"
            isMulti={true}
            options={userOptions}
            placeholder="Selecciona los usuarios que operan en esta sucursal…"
            helperText="La sucursal por defecto de cada usuario se configura desde su formulario de edición."
          />
        </div>
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar sucursales
export function BranchFormDialog({
  open,
  onOpenChange,
  branch,
  onSaved,
}: BranchFormDialogProps) {
  if (!open) return null;

  return (
    <BranchFormBody
      key={branch ? `edit-${branch.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      branch={branch}
      onSaved={onSaved}
    />
  );
}
