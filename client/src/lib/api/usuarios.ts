import { apiFetch } from "@/lib/api/http";
import type { RolNombre, Usuario, UsuarioEstado } from "@/lib/types";

interface UsuarioApi {
  id_usuario: number;
  nombre: string;
  usuario: string;
  estado: UsuarioEstado;
  fecha_registro: string;
  id_rol: number;
  rol: { id_rol: number; nombre: RolNombre };
}

function toUsuario(u: UsuarioApi): Usuario {
  return {
    id_usuario: u.id_usuario,
    nombre: u.nombre,
    usuario: u.usuario,
    estado: u.estado,
    fecha_registro: u.fecha_registro,
    id_rol: u.id_rol,
    rol: u.rol.nombre,
  };
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const data = await apiFetch<UsuarioApi[]>("/usuarios");
  return data.map(toUsuario);
}

export interface UsuarioInput {
  nombre: string;
  usuario: string;
  rol: RolNombre;
  estado: UsuarioEstado;
  /** Vacío/undefined en edición = no cambiar la contraseña. */
  contrasena?: string;
}

function rolToId(rol: RolNombre): number {
  return rol === "ADMINISTRADOR" ? 1 : 2;
}

export async function createUsuario(input: UsuarioInput): Promise<Usuario> {
  const data = await apiFetch<UsuarioApi>("/usuarios", {
    method: "POST",
    body: JSON.stringify({
      nombre: input.nombre,
      usuario: input.usuario,
      contrasena: input.contrasena,
      estado: input.estado,
      id_rol: rolToId(input.rol),
    }),
  });
  return toUsuario(data);
}

export async function updateUsuario(
  id: number,
  input: UsuarioInput
): Promise<Usuario> {
  const data = await apiFetch<UsuarioApi>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      nombre: input.nombre,
      usuario: input.usuario,
      contrasena: input.contrasena || undefined,
      estado: input.estado,
      id_rol: rolToId(input.rol),
    }),
  });
  return toUsuario(data);
}

export async function deleteUsuario(id: number): Promise<void> {
  await apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" });
}
