"use client";

import type { Sesion } from "@/lib/types";

const SESSION_KEY = "farmacia:session";

export function getClientSession(): Sesion | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Sesion;
  } catch {
    return null;
  }
}

export function setClientSession(sesion: Sesion): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

export function clearClientSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}
