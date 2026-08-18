/**
 * Base del mock layer de datos. Los módulos (medicamentos, ventas, etc.)
 * construyen sus funciones fetch* sobre `readCollection`/`writeCollection`
 * con la misma forma async que tendrán al llamar a la API real — así,
 * conectar el backend más adelante solo cambia el cuerpo de esas funciones,
 * no las pantallas que las consumen.
 */

const MOCK_DELAY_MS = 300;

export function delay(ms: number = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storageKey(collection: string): string {
  return `farmacia:${collection}`;
}

/** Lee una colección de localStorage; si no existe, la siembra con `seed` y la persiste. */
export function readCollection<T>(collection: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const key = storageKey(collection);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

export function writeCollection<T>(collection: string, data: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(collection), JSON.stringify(data));
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}
