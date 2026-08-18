import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const sesion = await getSession();
  if (!sesion) {
    return NextResponse.json({ sesion: null }, { status: 401 });
  }
  return NextResponse.json({ sesion });
}
