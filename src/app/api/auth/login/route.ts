import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth/session";
import type { Sesion } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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

  const laravelRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });

  const data = await laravelRes.json().catch(() => null);

  if (!laravelRes.ok) {
    const message =
      data?.message ?? data?.errors?.usuario?.[0] ?? "Usuario o contraseña incorrectos.";
    return NextResponse.json({ message }, { status: laravelRes.status });
  }

  const sesion: Sesion = {
    id_usuario: data.usuario.id_usuario,
    nombre: data.usuario.nombre,
    usuario: data.usuario.usuario,
    rol: data.usuario.rol.nombre,
    token: data.token,
  };
  await setSession(sesion);

  return NextResponse.json({ sesion });
}
