"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Users } from "lucide-react";
import { FormDialog } from "@/components/layout/form-dialog";
import { InputTextField, PasswordField, Select2Field } from "@/components/form";
import { create, update } from "@/lib/api/users";
import { fetchRoles } from "@/lib/api/roles";
import { fetchBranches } from "@/lib/api/branches";
import type { IUser, IUserRequest } from "@/lib/types/user";
import type { IRole } from "@/lib/types/role";
import type { IBranch } from "@/lib/types/branch";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";

const userSchema = z
  .object({
    firstname: z.string().trim().min(1, "El nombre es obligatorio."),
    lastname: z.string().trim().min(1, "El apellido es obligatorio."),
    username: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("El correo electrónico no es válido."),
    password: z.string().optional(),
    roles: z.array(z.string()).min(1, "Selecciona al menos un rol para el usuario."),
    branch_ids: z.array(z.number()).optional(),
    default_branch_id: z.number().nullable().optional(),
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
  availableRoles?: IRole[];
}

function UserFormBody({
  open,
  onOpenChange,
  user,
  onSaved,
  availableRoles: propRoles,
}: UserFormDialogProps) {
  const isEditing = Boolean(user);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rolesList, setRolesList] = useState<IRole[]>(propRoles || []);
  const [branchesList, setBranchesList] = useState<IBranch[]>([]);

  useEffect(() => {
    if (propRoles && propRoles.length > 0) {
      setRolesList(propRoles);
      return;
    }

    fetchRoles()
      .then(setRolesList)
      .catch(() => setRolesList([]));
  }, [propRoles]);

  useEffect(() => {
    fetchBranches()
      .then(setBranchesList)
      .catch(() => setBranchesList([]));
  }, []);

  const defaultRoles =
    user?.roles?.map((r) => r.name) ||
    (user?.role_names && user.role_names.length > 0 ? user.role_names : ["seller"]);

  const defaultFirstname = user?.firstname || (user?.name ? user.name.split(" ")[0] : "");
  const defaultLastname = user?.lastname || (user?.name ? user.name.split(" ").slice(1).join(" ") : "");
  const defaultBranchIds = user?.branches?.map((b) => b.id) ?? [];
  const defaultDefaultBranchId = user?.branches?.find((b) => b.is_default)?.id ?? null;

  const methods = useForm<UserFormValues>({
    resolver: zodResolver(userSchema as any),
    defaultValues: {
      firstname: defaultFirstname,
      lastname: defaultLastname,
      username: user?.username ?? "",
      email: user?.email ?? "",
      password: "",
      roles: defaultRoles,
      branch_ids: defaultBranchIds,
      default_branch_id: defaultDefaultBranchId,
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  const watchedBranchIds = watch("branch_ids") ?? [];
  const watchedDefaultBranchId = watch("default_branch_id");

  useEffect(() => {
    if (watchedDefaultBranchId && !watchedBranchIds.includes(watchedDefaultBranchId)) {
      setValue("default_branch_id", watchedBranchIds[0] ?? null);
    }
  }, [watchedBranchIds, watchedDefaultBranchId, setValue]);

  async function onSubmit(data: UserFormValues) {
    setServerError(null);

    const payload: IUserRequest = {
      firstname: data.firstname.trim(),
      lastname: data.lastname.trim(),
      username: data.username ? data.username.trim() : undefined,
      email: data.email.trim(),
      roles: data.roles,
      password: data.password || undefined,
      branch_ids: data.branch_ids,
      default_branch_id: data.default_branch_id,
    };

    if (!isEditing && !data.password) {
      setError("password", { message: "La contraseña es obligatoria para nuevos usuarios." });
      return;
    }

    try {
      const response = user ? await update(user.id, payload) : await create(payload);
      onSaved?.(response.data);
      onOpenChange(false);
    } catch (err: any) {
      setFormErrorsFromServer<UserFormValues>(err, setError, setFocus);

      const message =
        err?.response?.data?.message || err?.message || "No se pudo guardar el usuario.";
      setServerError(message);
    }
  }

  const roleOptions =
    rolesList.length > 0
      ? rolesList.map((r) => ({
          value: r.name,
          label: r.name === "administrator" ? "Administrador" : r.name === "seller" ? "Vendedor" : r.name,
          sublabel:
            r.name === "administrator"
              ? "Control y acceso total al sistema"
              : r.name === "seller"
              ? "Ventas, inventario y caja"
              : undefined,
          icon:
            r.name === "administrator" ? (
              <Shield className="size-3.5 text-primary" />
            ) : (
              <Users className="size-3.5 text-muted-foreground" />
            ),
        }))
      : [
          {
            value: "administrator",
            label: "Administrador",
            sublabel: "Control y acceso total al sistema",
            icon: <Shield className="size-3.5 text-primary" />,
          },
          {
            value: "seller",
            label: "Vendedor",
            sublabel: "Ventas, inventario y caja",
            icon: <Users className="size-3.5 text-muted-foreground" />,
          },
        ];

  return (
    <FormDialog
      methods={methods}
      open={open}
      onOpenChange={onOpenChange}
      isEditing={isEditing}
      title={{ create: "Nuevo Usuario", edit: "Editar Usuario" }}
      description={{
        create: "Completa los datos del usuario, credenciales de inicio de sesión y asignación de roles.",
        edit: "Actualiza los datos personales, usuario, contraseña o roles asignados.",
      }}
      submitLabel={{ create: "Crear Usuario", edit: "Guardar Cambios" }}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="firstname"
            label="Nombres"
            required
            placeholder="Ej. Juan"
            autoFocus
          />
          <InputTextField
            name="lastname"
            label="Apellidos"
            required
            placeholder="Ej. Pérez Gómez"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputTextField
            name="username"
            label="Nombre de Usuario (Username)"
            placeholder="Ej. jperez (Opcional)"
          />
          <InputTextField
            name="email"
            label="Correo Electrónico (Login)"
            required
            type="email"
            placeholder="juan@farmacia.com"
          />
        </div>

        <div className="w-full">
          <PasswordField
            name="password"
            label={isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
            required={!isEditing}
            placeholder={isEditing ? "Dejar en blanco para conservar contraseña actual" : "Mínimo 6 caracteres"}
          />
        </div>

        <div className="w-full">
          <Select2Field
            name="roles"
            label="Roles Asignados en el Sistema"
            required
            isMulti={true}
            options={roleOptions}
            placeholder="Selecciona uno o más roles para este usuario…"
          />
        </div>

        {branchesList.length > 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select2Field
              name="branch_ids"
              label="Sucursales Asignadas"
              isMulti={true}
              options={branchesList.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="Selecciona las sucursales donde puede operar…"
            />
            <Select2Field
              name="default_branch_id"
              label="Sucursal por Defecto"
              options={branchesList
                .filter((b) => watchedBranchIds.includes(b.id))
                .map((b) => ({ value: b.id, label: b.name }))}
              placeholder="Sucursal activa al iniciar sesión…"
              disabled={watchedBranchIds.length === 0}
              helperText="Con la que el usuario iniciará sesión por defecto."
            />
          </div>
        )}
      </div>
    </FormDialog>
  );
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onSaved,
  availableRoles,
}: UserFormDialogProps) {
  if (!open) return null;

  return (
    <UserFormBody
      key={user ? `edit-${user.id}` : "new"}
      open={open}
      onOpenChange={onOpenChange}
      user={user}
      currentUserId={currentUserId}
      onSaved={onSaved}
      availableRoles={availableRoles}
    />
  );
}

export const UsuarioFormDialog = UserFormDialog;
