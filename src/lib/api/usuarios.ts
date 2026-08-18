import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import type { RolNombre, Usuario, UsuarioEstado } from "@/lib/types";

/**
 * Espejo de `lib/auth/mock-users.ts` (mismos id/usuario) para que esta
 * pantalla y el login mock muestren datos consistentes. El login real sigue
 * validando contra `mock-users.ts` (corre en el servidor, sin acceso a
 * localStorage) — cuando exista backend, ambos colapsan en una sola fuente.
 */
const USUARIOS_SEED: Usuario[] = [
  {
    id_usuario: 1,
    nombre: "Elkin Farmacia",
    usuario: "admin",
    estado: "activo",
    fecha_registro: "2026-01-05",
    id_rol: 1,
    rol: "ADMINISTRADOR",
  },
  {
    id_usuario: 2,
    nombre: "Vendedor Mostrador",
    usuario: "vendedor",
    estado: "activo",
    fecha_registro: "2026-01-05",
    id_rol: 2,
    rol: "VENDEDOR",
  },
];

const USUARIOS_KEY = "usuarios";

export async function fetchUsuarios(): Promise<Usuario[]> {
  await delay();
  return readCollection<Usuario>(USUARIOS_KEY, USUARIOS_SEED);
}

export interface UsuarioInput {
  nombre: string;
  usuario: string;
  rol: RolNombre;
  estado: UsuarioEstado;
  /** Vacío/undefined en edición = no cambiar la contraseña. */
  contrasena?: string;
}

function nextId(usuarios: Usuario[]): number {
  return usuarios.reduce((max, u) => Math.max(max, u.id_usuario), 0) + 1;
}

function rolToId(rol: RolNombre): number {
  return rol === "ADMINISTRADOR" ? 1 : 2;
}

function assertUsuarioUnico(usuarios: Usuario[], usuario: string, ignoreId?: number) {
  const exists = usuarios.some(
    (u) => u.usuario.toLowerCase() === usuario.toLowerCase() && u.id_usuario !== ignoreId
  );
  if (exists) {
    throw new ApiError(`Ya existe un usuario con el nombre de usuario "${usuario}".`, 409);
  }
}

function assertQuedaUnAdminActivo(usuarios: Usuario[], excluirId: number) {
  const quedan = usuarios.some(
    (u) => u.id_usuario !== excluirId && u.rol === "ADMINISTRADOR" && u.estado === "activo"
  );
  if (!quedan) {
    throw new ApiError("Debe quedar al menos un administrador activo.", 409);
  }
}

export async function createUsuario(input: UsuarioInput): Promise<Usuario> {
  await delay();
  if (!input.contrasena) {
    throw new ApiError("La contraseña es obligatoria para un usuario nuevo.", 400);
  }
  const usuarios = readCollection<Usuario>(USUARIOS_KEY, USUARIOS_SEED);
  assertUsuarioUnico(usuarios, input.usuario);
  const nuevo: Usuario = {
    id_usuario: nextId(usuarios),
    nombre: input.nombre,
    usuario: input.usuario,
    estado: input.estado,
    fecha_registro: new Date().toISOString().slice(0, 10),
    id_rol: rolToId(input.rol),
    rol: input.rol,
  };
  writeCollection(USUARIOS_KEY, [...usuarios, nuevo]);
  return nuevo;
}

export async function updateUsuario(
  id: number,
  input: UsuarioInput,
  currentUserId: number | null
): Promise<Usuario> {
  await delay();
  const usuarios = readCollection<Usuario>(USUARIOS_KEY, USUARIOS_SEED);
  const actual = usuarios.find((u) => u.id_usuario === id);
  if (!actual) {
    throw new ApiError("El usuario ya no existe.", 404);
  }
  assertUsuarioUnico(usuarios, input.usuario, id);

  const seDesactivaOCambiaRol =
    (input.estado === "inactivo" && actual.estado === "activo") ||
    (input.rol !== "ADMINISTRADOR" && actual.rol === "ADMINISTRADOR");
  if (seDesactivaOCambiaRol) {
    assertQuedaUnAdminActivo(usuarios, id);
  }
  if (id === currentUserId && (input.estado === "inactivo" || input.rol !== "ADMINISTRADOR") && actual.rol === "ADMINISTRADOR") {
    throw new ApiError("No puedes quitarte tu propio acceso de administrador.", 409);
  }

  const actualizado: Usuario = {
    ...actual,
    nombre: input.nombre,
    usuario: input.usuario,
    estado: input.estado,
    id_rol: rolToId(input.rol),
    rol: input.rol,
  };
  writeCollection(
    USUARIOS_KEY,
    usuarios.map((u) => (u.id_usuario === id ? actualizado : u))
  );
  return actualizado;
}

export async function deleteUsuario(id: number, currentUserId: number | null): Promise<void> {
  await delay();
  if (id === currentUserId) {
    throw new ApiError("No puedes eliminar tu propia cuenta.", 409);
  }
  const usuarios = readCollection<Usuario>(USUARIOS_KEY, USUARIOS_SEED);
  const actual = usuarios.find((u) => u.id_usuario === id);
  if (actual?.rol === "ADMINISTRADOR" && actual.estado === "activo") {
    assertQuedaUnAdminActivo(usuarios, id);
  }
  writeCollection(
    USUARIOS_KEY,
    usuarios.filter((u) => u.id_usuario !== id)
  );
}
