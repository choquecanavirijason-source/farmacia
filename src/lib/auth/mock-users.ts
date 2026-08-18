import type { RolNombre } from "@/lib/types";

/**
 * Usuarios semilla mientras no hay backend.
 * Contraseña en texto plano solo para el mock — el backend real hará
 * verificación de hash (bcrypt/argon2) contra la tabla Usuario.
 */
export interface MockUser {
  id_usuario: number;
  nombre: string;
  usuario: string;
  contrasena: string;
  rol: RolNombre;
}

export const MOCK_USERS: MockUser[] = [
  {
    id_usuario: 1,
    nombre: "Elkin Farmacia",
    usuario: "admin",
    contrasena: "admin123",
    rol: "ADMINISTRADOR",
  },
  {
    id_usuario: 2,
    nombre: "Vendedor Mostrador",
    usuario: "vendedor",
    contrasena: "vendedor123",
    rol: "VENDEDOR",
  },
];

export function findMockUser(usuario: string, contrasena: string): MockUser | null {
  const match = MOCK_USERS.find(
    (u) => u.usuario === usuario && u.contrasena === contrasena
  );
  return match ?? null;
}
