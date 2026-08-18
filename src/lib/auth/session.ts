import "server-only";
import { cookies } from "next/headers";
import type { Sesion } from "@/lib/types";

/**
 * Cookie de sesión mock (JSON plano, sin firmar). Al conectar el backend
 * real esto se reemplaza por un JWT/token opaco verificado por el servidor.
 */
export const SESSION_COOKIE = "session";

export async function getSession(): Promise<Sesion | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Sesion;
  } catch {
    return null;
  }
}

export async function setSession(sesion: Sesion) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(sesion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
