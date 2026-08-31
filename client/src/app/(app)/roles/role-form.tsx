"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  CheckSquare,
  Square,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { create, update, fetchPermissions } from "@/lib/api/roles";
import type { IRole, IRoleRequest } from "@/lib/types/role";
import type { IPermissionsResponse } from "@/lib/types/permission";

const roleSchema = z.object({
  name: z.string().trim().min(1, "El nombre del rol es obligatorio.").max(100),
  permissions: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role?: IRole | null;
}

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter();
  const isEditing = Boolean(role);
  const isAdministrator = role?.name?.toLowerCase() === "administrator";

  const [serverError, setServerError] = useState<string | null>(null);
  const [permissionsData, setPermissionsData] = useState<IPermissionsResponse | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const methods = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? "",
      permissions: role?.permissions ?? [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  const selectedPermissions = watch("permissions") || [];

  useEffect(() => {
    setLoadingPerms(true);
    fetchPermissions()
      .then((data) => setPermissionsData(data))
      .catch(() => setPermissionsData(null))
      .finally(() => setLoadingPerms(false));
  }, []);

  const allAvailable = useMemo(() => permissionsData?.all || [], [permissionsData]);

  const areAllSelected = useMemo(
    () => allAvailable.length > 0 && allAvailable.every((p) => selectedPermissions.includes(p)),
    [allAvailable, selectedPermissions]
  );

  function toggleSelectAll() {
    if (areAllSelected) {
      setValue("permissions", []);
    } else {
      setValue("permissions", [...allAvailable]);
    }
  }

  function toggleGroup(perms: string[]) {
    const allInGroupSelected = perms.every((p) => selectedPermissions.includes(p));
    if (allInGroupSelected) {
      setValue(
        "permissions",
        selectedPermissions.filter((p) => !perms.includes(p))
      );
    } else {
      const merged = Array.from(new Set([...selectedPermissions, ...perms]));
      setValue("permissions", merged);
    }
  }

  async function onSubmit(data: RoleFormValues) {
    setServerError(null);

    const payload: IRoleRequest = {
      name: data.name.trim(),
      permissions: data.permissions,
    };

    try {
      if (role) {
        await update(role.id, payload);
        toast.success(`Rol "${payload.name}" actualizado con éxito.`);
      } else {
        await create(payload);
        toast.success(`Rol "${payload.name}" creado con éxito.`);
      }

      router.push("/roles");
      router.refresh();
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.keys(fieldErrors).forEach((key) => {
          const field = key as keyof RoleFormValues;
          const msg = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
          setError(field, { type: "server", message: msg });
        });
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el rol.";
      setServerError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Encabezado y botón Volver */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button nativeButton={false} render={<Link href="/roles" />} variant="outline" size="icon" className="size-9 shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? `Editar Rol: ${role?.name}` : "Nuevo Rol de Usuario"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Actualiza el nombre y los permisos otorgados a los usuarios asignados a este rol."
                : "Define un nuevo perfil de acceso y selecciona los permisos asignados en cada módulo."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button nativeButton={false} render={<Link href="/roles" />} variant="outline" size="sm">
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {isEditing ? "Guardar Cambios" : "Crear Rol"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerta de error del servidor */}
      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Tarjeta de información básica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información General</CardTitle>
          <CardDescription>
            Nombre identificador del rol en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 max-w-md">
            <Label htmlFor="name" className="text-xs font-semibold">
              Nombre del Rol <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej. Farmacéutico, Auditor, Supervisor de Caja"
              disabled={isAdministrator}
              {...register("name")}
              autoFocus={!isEditing}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
            {isAdministrator && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                El rol de Administrador principal tiene acceso total al sistema y su nombre no puede modificarse.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Permisos del Sistema */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Matriz de Permisos Granulares
                </CardTitle>
                <CardDescription>
                  {selectedPermissions.length} permisos seleccionados actualmente
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 self-start sm:self-auto text-xs"
              onClick={toggleSelectAll}
              disabled={loadingPerms}
            >
              {areAllSelected ? (
                <>
                  <Square className="size-3.5" /> Desmarcar todos
                </>
              ) : (
                <>
                  <CheckSquare className="size-3.5" /> Seleccionar todos
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loadingPerms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))}
            </div>
          ) : permissionsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(permissionsData.groups).map(([key, group]) => {
                const groupPermNames = group.permissions.map((p) => p.name);
                const isGroupAllSelected = groupPermNames.every((p) =>
                  selectedPermissions.includes(p)
                );

                return (
                  <div
                    key={key}
                    className="flex flex-col rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs"
                  >
                    <div className="flex items-center justify-between p-3 bg-muted/40 border-b gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground/90 block truncate">
                          {group.title}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {group.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-medium shrink-0"
                        onClick={() => toggleGroup(groupPermNames)}
                      >
                        {isGroupAllSelected ? "Desmarcar" : "Marcar todo"}
                      </Button>
                    </div>

                    <div className="p-3.5 flex flex-col gap-2.5 flex-1 bg-background/50">
                      {group.permissions.map((p) => {
                        const isChecked = selectedPermissions.includes(p.name);
                        return (
                          <div
                            key={p.name}
                            className="flex items-center space-x-2.5 py-0.5"
                          >
                            <Checkbox
                              id={`perm-${p.name}`}
                              checked={isChecked}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setValue("permissions", [
                                    ...selectedPermissions,
                                    p.name,
                                  ]);
                                } else {
                                  setValue(
                                    "permissions",
                                    selectedPermissions.filter(
                                      (perm) => perm !== p.name
                                    )
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`perm-${p.name}`}
                              className="text-xs font-normal cursor-pointer select-none leading-tight"
                            >
                              {p.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-destructive text-center py-6">
              Error al cargar los permisos del sistema.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botones inferiores */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button nativeButton={false} render={<Link href="/roles" />} variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-1.5 min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              {isEditing ? "Guardar Cambios" : "Crear Rol"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
