"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { KeyRound, User } from "lucide-react";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField } from "@/components/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/api/auth";
import { useAuth, type AuthUser } from "@/context/auth-context";

const profileSchema = z
  .object({
    firstname: z.string().trim().min(1, "El nombre es obligatorio."),
    lastname: z.string().trim().min(1, "El apellido es obligatorio."),
    username: z.string().trim().min(3, "El nombre de usuario debe tener al menos 3 caracteres."),
    email: z.string().trim().email("Ingresa un correo electrónico válido."),
    change_password: z.boolean(),
    current_password: z.string().optional(),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.change_password) {
      if (!data.current_password || data.current_password.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["current_password"],
          message: "Ingresa tu contraseña actual.",
        });
      }
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "La nueva contraseña debe tener al menos 6 caracteres.",
        });
      }
      if (data.password !== data.password_confirmation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password_confirmation"],
          message: "Las contraseñas no coinciden.",
        });
      }
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
}

function EditProfileBody({ open, onOpenChange, user }: EditProfileDialogProps) {
  const { refreshUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstname: user?.firstname ?? "",
      lastname: user?.lastname ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      change_password: false,
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    setError,
    formState: { isSubmitting },
  } = methods;

  const changePassword = watch("change_password");

  async function onSubmit(data: ProfileFormValues) {
    setServerError(null);

    const payload = {
      firstname: data.firstname.trim(),
      lastname: data.lastname.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      ...(data.change_password
        ? {
            current_password: data.current_password,
            password: data.password,
            password_confirmation: data.password_confirmation,
          }
        : {}),
    };

    try {
      await updateProfile(payload);
      await refreshUser();
      toast.success("Perfil actualizado con éxito.");
      onOpenChange(false);
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.keys(fieldErrors).forEach((key) => {
          const field = key as keyof ProfileFormValues;
          const msg = Array.isArray(fieldErrors[key])
            ? fieldErrors[key][0]
            : fieldErrors[key];
          setError(field, { type: "server", message: msg });
        });
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar el perfil.";
      setServerError(message);
    }
  }

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={true}
      title="Editar Perfil"
      description="Actualiza tu información personal o cambia tu contraseña de acceso."
      submitLabel={{ edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <User className="size-4 text-primary" />
          <span>Datos Personales</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="firstname"
            label="Nombre"
            required
            placeholder="Ej. Juan"
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
            name="username"
            label="Nombre de Usuario"
            required
            placeholder="Ej. juanperez"
          />
          <InputTextField
            name="email"
            label="Correo Electrónico"
            type="email"
            required
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <KeyRound className="size-4 text-primary" />
            <span>Cambiar Contraseña</span>
          </div>
          <Controller
            control={control}
            name="change_password"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch
                  id="change_password"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="change_password" className="cursor-pointer text-xs font-normal">
                  {field.value ? "Activado" : "Desactivado"}
                </Label>
              </div>
            )}
          />
        </div>

        {changePassword && (
          <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <InputTextField
              name="current_password"
              label="Contraseña Actual"
              type="password"
              required
              placeholder="Ingresa tu contraseña actual"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputTextField
                name="password"
                label="Nueva Contraseña"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
              />
              <InputTextField
                name="password_confirmation"
                label="Confirmar Contraseña"
                type="password"
                required
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  if (!open || !user) return null;

  return (
    <EditProfileBody
      key={`profile-${user.id}`}
      open={open}
      onOpenChange={onOpenChange}
      user={user}
    />
  );
}
