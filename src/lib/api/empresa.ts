import { delay } from "@/lib/api/client";
import type { Empresa } from "@/lib/types";

/**
 * Registro único (no colección) — se guarda directo bajo una clave fija de
 * localStorage en vez de usar readCollection/writeCollection, que están
 * pensados para arrays.
 */
const EMPRESA_KEY = "farmacia:empresa";

const EMPRESA_SEED: Empresa = {
  nombre: "Farmacia Juan de Dios",
  nit: "",
  direccion: "Potosí, Bolivia",
  telefono: "",
  logo: null,
};

export async function fetchEmpresa(): Promise<Empresa> {
  await delay();
  if (typeof window === "undefined") return EMPRESA_SEED;
  const raw = window.localStorage.getItem(EMPRESA_KEY);
  if (!raw) return EMPRESA_SEED;
  try {
    return { ...EMPRESA_SEED, ...(JSON.parse(raw) as Partial<Empresa>) };
  } catch {
    return EMPRESA_SEED;
  }
}

export async function updateEmpresa(input: Empresa): Promise<Empresa> {
  await delay();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(EMPRESA_KEY, JSON.stringify(input));
  }
  return input;
}
