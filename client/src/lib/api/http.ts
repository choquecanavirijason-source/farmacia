import axios from "axios";
import { ApiError } from "@/lib/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Cliente HTTP basado en axios (en vez de fetch).
 * Mantiene la firma `(path, init?)` para no tocar los módulos que la usan,
 * y acepta `signal` (AbortSignal) para cancelar peticiones en vuelo.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await axios.request<T>({
      baseURL: API_URL,
      url: path,
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
      data: init?.body ? JSON.parse(init.body as string) : undefined,
      signal: init?.signal ?? undefined,
    });

    if (response.status === 204) {
      return undefined as T;
    }
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error;
    }
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const body = axios.isAxiosError(error) ? (error.response?.data as Record<string, unknown> | undefined) : undefined;
    const firstFieldError = Object.values((body?.errors ?? {}) as Record<string, string[]>)[0] as
      | string[]
      | undefined;
    const message = (body?.message as string | undefined) ?? firstFieldError?.[0] ?? "Error al comunicarse con el servidor.";
    throw new ApiError(message, status ?? 0);
  }
}

/** Descarga un archivo binario (Excel/PDF) generado por el backend. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await axios.request<Blob>({
    baseURL: API_URL,
    url: path,
    method: "GET",
    headers: {
      Accept: "application/octet-stream",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
