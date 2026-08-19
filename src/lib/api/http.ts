import { ApiError } from "@/lib/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const firstFieldError = Object.values(body?.errors ?? {})[0] as string[] | undefined;
    const message = body?.message ?? firstFieldError?.[0] ?? "Error al comunicarse con el servidor.";
    throw new ApiError(message, res.status);
  }

  return body as T;
}
