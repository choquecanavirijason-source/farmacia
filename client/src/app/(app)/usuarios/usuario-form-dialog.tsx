"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUsuario, updateUsuario, type UsuarioInput } from "@/lib/api/usuarios";
import { ApiError } from "@/lib/api/client";
import type { RolNombre, Usuario, UsuarioEstado } from "@/lib/types";

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
  currentUserId: number | null;
  onSaved: (usuario: Usuario) => void;
}

interface FormState {
  nombre: string;
  usuario: string;
  contrasena: string;
  rol: RolNombre;
  estado: UsuarioEstado;
}

function UsuarioFormBody({
  onOpenChange,
  usuario,
  currentUserId,
  onSaved,
}: Omit<UsuarioFormDialogProps, "open">) {
  const isEditing = Boolean(usuario);
  const [form, setForm] = useState<FormState>(() => ({
    nombre: usuario?.nombre ?? "",
    usuario: usuario?.usuario ?? "",
    contrasena: "",
    rol: usuario?.rol ?? "VENDEDOR",
    estado: usuario?.estado ?? "activo",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.nombre.trim() || !form.usuario.trim()) {
      setError("Nombre y usuario son obligatorios.");
      return;
    }
    if (!isEditing && form.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (isEditing && form.contrasena && form.contrasena.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const input: UsuarioInput = {
      nombre: form.nombre.trim(),
      usuario: form.usuario.trim(),
      rol: form.rol,
      estado: form.estado,
      contrasena: form.contrasena || undefined,
    };

    setSaving(true);
    try {
      const saved = usuario
        ? await updateUsuario(usuario.id_usuario, input)
        : await createUsuario(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Actualiza los datos del usuario." : "Crea una cuenta de acceso al sistema."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="usuario">Usuario (login)</Label>
            <Input
              id="usuario"
              value={form.usuario}
              onChange={(e) => update("usuario", e.target.value)}
              disabled={saving}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contrasena">
              {isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}
            </Label>
            <Input
              id="contrasena"
              type="password"
              value={form.contrasena}
              onChange={(e) => update("contrasena", e.target.value)}
              disabled={saving}
              autoComplete="new-password"
              placeholder={isEditing ? "Dejar en blanco para no cambiarla" : undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rol">Rol</Label>
            <Select value={form.rol} onValueChange={(v) => update("rol", v as RolNombre)} disabled={saving}>
              <SelectTrigger id="rol" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem value="VENDEDOR">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={form.estado}
              onValueChange={(v) => update("estado", v as UsuarioEstado)}
              disabled={saving}
            >
              <SelectTrigger id="estado" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm wrap-break-word text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Guardando…
              </>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Crear usuario"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function UsuarioFormDialog({ open, onOpenChange, ...bodyProps }: UsuarioFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <UsuarioFormBody
            key={bodyProps.usuario?.id_usuario ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
