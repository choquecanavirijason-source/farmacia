import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function POST() {
  const sesion = await getSession();
  if (sesion) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${sesion.token}` },
    }).catch(() => null);
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
