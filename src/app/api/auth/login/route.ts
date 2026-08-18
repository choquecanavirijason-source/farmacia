import { NextResponse } from "next/server";
import { findMockUser } from "@/lib/auth/mock-users";
import { setSession } from "@/lib/auth/session";
import type { Sesion } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const usuario = typeof body?.usuario === "string" ? body.usuario.trim() : "";
  const contrasena = typeof body?.contrasena === "string" ? body.contrasena : "";

  if (!usuario || !contrasena) {
    return NextResponse.json(
      { message: "Usuario y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  const match = findMockUser(usuario, contrasena);
  if (!match) {
    return NextResponse.json(
      { message: "Usuario o contraseña incorrectos." },
      { status: 401 }
    );
  }

  const sesion: Sesion = {
    id_usuario: match.id_usuario,
    nombre: match.nombre,
    usuario: match.usuario,
    rol: match.rol,
  };
  await setSession(sesion);

  return NextResponse.json({ sesion });
}
