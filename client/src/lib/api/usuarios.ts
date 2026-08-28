import { apiFetch } from "@/lib/api/http";
import type { RolNombre, Usuario, UsuarioEstado } from "@/lib/types";

interface ServerUser {
  id: number;
  name: string;
  email: string;
  firstname: string;
  lastname: string;
  state: "active" | "inactive";
  roles?: { name: string }[];
  created_at?: string;
}

function toUsuario(u: ServerUser): Usuario {
  return {
    id_usuario: u.id,
    nombre: u.name,
    usuario: u.email,
    estado: u.state === "active" ? "activo" : "inactivo",
    fecha_registro: u.created_at ?? "",
    id_rol: u.roles?.[0]?.name === "administrator" ? 1 : 2,
    rol: u.roles?.[0]?.name === "administrator" ? "ADMINISTRADOR" : "VENDEDOR",
  };
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const response = await apiFetch<{ data: ServerUser[] }>(
    "/users?per_page=100",
  );
  return response.data.map(toUsuario);
}

export interface UsuarioInput {
  nombre: string;
  usuario: string;
  rol: RolNombre;
  estado: UsuarioEstado;
  /** Vacío/undefined en edición = no cambiar la contraseña. */
  contrasena?: string;
}

export async function createUsuario(input: UsuarioInput): Promise<Usuario> {
  const response = await apiFetch<{ data: ServerUser }>("/users", {
    method: "POST",
    body: JSON.stringify({
      name: input.nombre,
      firstname: input.nombre.split(" ")[0],
      lastname: input.nombre.split(" ").slice(1).join(" ") || input.nombre,
      email: input.usuario,
      password: input.contrasena,
      state: input.estado === "activo" ? "active" : "inactive",
      role: input.rol === "ADMINISTRADOR" ? "administrator" : "seller",
    }),
  });
  return toUsuario(response.data);
}

export async function updateUsuario(
  id: number,
  input: UsuarioInput,
): Promise<Usuario> {
  const response = await apiFetch<{ data: ServerUser }>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.nombre,
      firstname: input.nombre.split(" ")[0],
      lastname: input.nombre.split(" ").slice(1).join(" ") || input.nombre,
      email: input.usuario,
      password: input.contrasena || undefined,
      state: input.estado === "activo" ? "active" : "inactive",
      role: input.rol === "ADMINISTRADOR" ? "administrator" : "seller",
    }),
  });
  return toUsuario(response.data);
}

export async function deleteUsuario(id: number): Promise<void> {
  await apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}
