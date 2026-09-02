"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, NumericField } from "@/components/form";
import { create, update as updateClient } from "@/lib/api/clients";
import type { IClient, IClientRequest } from "@/lib/types/client";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

// Esquema de validación con Zod para Clientes
const clientSchema = z.object({
  firstname: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  lastname: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  ci: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || null),
  nit: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || null),
  phone: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || null),
  address: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

type ClientFormData = z.input<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: IClient | null;
  onSaved: (client: IClient) => void;
}

function ClientFormBody({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDialogProps) {
  const isEditing = Boolean(client);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstname: client?.firstname ?? "",
      lastname: client?.lastname ?? "",
      ci: client?.ci ?? "",
      nit: client?.nit ?? "",
      phone: client?.phone ?? "",
      address: client?.address ?? "",
    },
  });

  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: ClientFormData) {
    setServerError(null);

    const payload: IClientRequest = {
      firstname: data.firstname.trim(),
      lastname: data.lastname.trim(),
      ci: data.ci ? data.ci.trim() : null,
      nit: data.nit ? data.nit.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      address: data.address ? data.address.trim() : null,
    };

    try {
      const response = client
        ? await updateClient(client.id, payload)
        : await create(payload);

      onSaved(response.data);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<ClientFormData>(err, setError, setFocus);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el cliente.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo cliente", edit: "Editar cliente" }}
      description={{
        create: "Ingresa la información para registrar un nuevo cliente.",
        edit: "Actualiza los datos del cliente seleccionado.",
      }}
      submitLabel={{ create: "Crear cliente", edit: "Guardar cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputTextField
          name="firstname"
          label="Nombre"
          required
          placeholder="Ej. Juan"
          autoFocus
        />
        <InputTextField
          name="lastname"
          label="Apellido"
          required
          placeholder="Ej. Pérez"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputTextField
          name="ci"
          label="Cédula de Identidad (CI)"
          placeholder="Ej. 1234567"
        />
        <InputTextField
          name="nit"
          label="NIT"
          placeholder="Ej. 123456789"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumericField
          name="phone"
          label="Teléfono"
          placeholder="Ej. 70012345"
        />
        <InputTextField
          name="address"
          label="Dirección"
          placeholder="Ej. Av. Principal #123"
        />
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar clientes
export function ClientFormDialog({ open, onOpenChange, client, onSaved }: ClientFormDialogProps) {
  return (
    <ClientFormBody
      key={client ? `edit-${client.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      client={client}
      onSaved={onSaved}
    />
  );
}

// Alias de compatibilidad
export const ClienteFormDialog = ClientFormDialog;
