"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, PasswordField } from "@/components/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { create, update } from "@/lib/api/users";
import { fetchRoles } from "@/lib/api/roles";
import type { IUser, IUserRequest } from "@/lib/types/user";
import type { IRole } from "@/lib/types/role";

// Esquema de validación con Zod para Usuarios
const userSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio."),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("El correo electrónico no es válido."),
    password: z.string().optional(),
    role: z.string().min(1, "Selecciona un rol."),
    state: z.enum(["active", "inactive"]),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.length > 0 && data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }
  });

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUser | null;
  currentUserId?: number | null;
  onSaved?: (user?: IUser) => void;
}

function UserFormBody({
  open,
  onOpenChange,
  user,
  onSaved,
}: UserFormDialogProps) {
  const isEditing = Boolean(user);
  const [serverError, setServerError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<IRole[]>([]);

  useEffect(() => {
    fetchRoles()
      .then(setAvailableRoles)
      .catch(() => setAvailableRoles([]));
  }, []);

  const userRole = user?.roles?.[0]?.name || "seller";

  const methods = useForm<UserFormValues>({
    resolver: zodResolver(userSchema as any),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: userRole,
      state: user?.state ?? "active",
    },
  });

  const {
    handleSubmit,
    control,
    setError,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: UserFormValues) {
    setServerError(null);

    const payload: IUserRequest = {
      name: data.name.trim(),
      email: data.email.trim(),
      state: data.state,
      role: data.role,
      password: data.password || undefined,
    };

    if (!isEditing && !data.password) {
      setError("password", { message: "La contraseña es obligatoria para nuevos usuarios." });
      return;
    }

    try {
      const response = user
        ? await update(user.id, payload)
        : await create(payload);

      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.keys(fieldErrors).forEach((key) => {
          const field = key as keyof UserFormValues;
          const msg = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
          setError(field, { type: "server", message: msg });
        });
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el usuario.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Usuario", edit: "Editar Usuario" }}
      description={{
        create: "Completa los campos para registrar un nuevo usuario con acceso al sistema.",
        edit: "Actualiza los datos y accesos del usuario.",
      }}
      submitLabel={{ create: "Crear Usuario", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <InputTextField
          name="name"
          label="Nombre Completo"
          required
          placeholder="Ej. Juan Pérez"
          autoFocus
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="email"
            label="Correo Electrónico (Login)"
            required
            type="email"
            placeholder="juan@farmacia.com"
          />
          <PasswordField
            name="password"
            label={isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
            placeholder={isEditing ? "Dejar en blanco para conservar" : "Mínimo 6 caracteres"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Rol en el Sistema</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.length > 0 ? (
                      availableRoles.map((r) => (
                        <SelectItem key={r.id} value={r.name} className="capitalize">
                          {r.name === "administrator" ? "Administrador" : r.name === "seller" ? "Vendedor" : r.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="administrator">Administrador</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="state">Estado</Label>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="state" className="w-full">
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
        </div>
      </div>
    </FormDialog>
  );
}

// Componente modal para crear y editar usuarios
export function UserFormDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onSaved,
}: UserFormDialogProps) {
  return (
    <UserFormBody
      key={user ? `edit-${user.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      user={user}
      currentUserId={currentUserId}
      onSaved={onSaved}
    />
  );
}

// Alias de compatibilidad
export const UsuarioFormDialog = UserFormDialog;
