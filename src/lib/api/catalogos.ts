import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import type { Categoria, Laboratorio, Medicamento, Presentacion } from "@/lib/types";

/**
 * Categoría, Presentación y Laboratorio son catálogos de referencia usados
 * por Medicamentos (FK). Antes vivían como semillas de solo lectura dentro
 * de `medicamentos.ts`; este módulo les da su propio CRUD sobre las mismas
 * claves de localStorage, así los medicamentos ya creados no pierden su
 * referencia.
 */

export const CATEGORIAS_SEED: Categoria[] = [
  { id_categoria: 1, nombre: "Analgésicos", descripcion: "Alivio del dolor" },
  { id_categoria: 2, nombre: "Antibióticos", descripcion: "Tratamiento de infecciones bacterianas" },
  { id_categoria: 3, nombre: "Antigripales", descripcion: "Síntomas de resfrío y gripe" },
  { id_categoria: 4, nombre: "Antiinflamatorios", descripcion: "Reducción de inflamación" },
];

export const PRESENTACIONES_SEED: Presentacion[] = [
  { id_presentacion: 1, nombre: "Tableta", descripcion: "Forma sólida oral" },
  { id_presentacion: 2, nombre: "Jarabe", descripcion: "Forma líquida oral" },
  { id_presentacion: 3, nombre: "Ampolla", descripcion: "Forma inyectable" },
  { id_presentacion: 4, nombre: "Cápsula", descripcion: "Forma sólida oral" },
];

export const LABORATORIOS_SEED: Laboratorio[] = [
  { id_laboratorio: 1, nombre: "Bagó", pais: "Bolivia", telefono: "22345678" },
  { id_laboratorio: 2, nombre: "Roche", pais: "Suiza", telefono: "22456789" },
  { id_laboratorio: 3, nombre: "Inti", pais: "Bolivia", telefono: "22567890" },
];

function medicamentosUsando(predicate: (m: Medicamento) => boolean): number {
  const medicamentos = readCollection<Medicamento>("medicamentos", []);
  return medicamentos.filter(predicate).length;
}

function nextId<T>(items: T[], idOf: (item: T) => number): number {
  return items.reduce((max, item) => Math.max(max, idOf(item)), 0) + 1;
}

// ---------- Categorías ----------

export async function fetchCategorias(): Promise<Categoria[]> {
  await delay();
  return readCollection<Categoria>("categorias", CATEGORIAS_SEED);
}

export type CategoriaInput = Omit<Categoria, "id_categoria">;

export async function createCategoria(input: CategoriaInput): Promise<Categoria> {
  await delay();
  const categorias = readCollection<Categoria>("categorias", CATEGORIAS_SEED);
  const nueva: Categoria = { ...input, id_categoria: nextId(categorias, (c) => c.id_categoria) };
  writeCollection("categorias", [...categorias, nueva]);
  return nueva;
}

export async function updateCategoria(id: number, input: CategoriaInput): Promise<Categoria> {
  await delay();
  const categorias = readCollection<Categoria>("categorias", CATEGORIAS_SEED);
  const actualizada: Categoria = { ...input, id_categoria: id };
  writeCollection(
    "categorias",
    categorias.map((c) => (c.id_categoria === id ? actualizada : c))
  );
  return actualizada;
}

export async function deleteCategoria(id: number): Promise<void> {
  await delay();
  const enUso = medicamentosUsando((m) => m.id_categoria === id);
  if (enUso > 0) {
    throw new ApiError(
      `No se puede eliminar: ${enUso} medicamento(s) usan esta categoría.`,
      409
    );
  }
  const categorias = readCollection<Categoria>("categorias", CATEGORIAS_SEED);
  writeCollection(
    "categorias",
    categorias.filter((c) => c.id_categoria !== id)
  );
}

// ---------- Presentaciones ----------

export async function fetchPresentaciones(): Promise<Presentacion[]> {
  await delay();
  return readCollection<Presentacion>("presentaciones", PRESENTACIONES_SEED);
}

export type PresentacionInput = Omit<Presentacion, "id_presentacion">;

export async function createPresentacion(input: PresentacionInput): Promise<Presentacion> {
  await delay();
  const presentaciones = readCollection<Presentacion>("presentaciones", PRESENTACIONES_SEED);
  const nueva: Presentacion = {
    ...input,
    id_presentacion: nextId(presentaciones, (p) => p.id_presentacion),
  };
  writeCollection("presentaciones", [...presentaciones, nueva]);
  return nueva;
}

export async function updatePresentacion(id: number, input: PresentacionInput): Promise<Presentacion> {
  await delay();
  const presentaciones = readCollection<Presentacion>("presentaciones", PRESENTACIONES_SEED);
  const actualizada: Presentacion = { ...input, id_presentacion: id };
  writeCollection(
    "presentaciones",
    presentaciones.map((p) => (p.id_presentacion === id ? actualizada : p))
  );
  return actualizada;
}

export async function deletePresentacion(id: number): Promise<void> {
  await delay();
  const enUso = medicamentosUsando((m) => m.id_presentacion === id);
  if (enUso > 0) {
    throw new ApiError(
      `No se puede eliminar: ${enUso} medicamento(s) usan esta presentación.`,
      409
    );
  }
  const presentaciones = readCollection<Presentacion>("presentaciones", PRESENTACIONES_SEED);
  writeCollection(
    "presentaciones",
    presentaciones.filter((p) => p.id_presentacion !== id)
  );
}

// ---------- Laboratorios ----------

export async function fetchLaboratorios(): Promise<Laboratorio[]> {
  await delay();
  return readCollection<Laboratorio>("laboratorios", LABORATORIOS_SEED);
}

export type LaboratorioInput = Omit<Laboratorio, "id_laboratorio">;

export async function createLaboratorio(input: LaboratorioInput): Promise<Laboratorio> {
  await delay();
  const laboratorios = readCollection<Laboratorio>("laboratorios", LABORATORIOS_SEED);
  const nuevo: Laboratorio = {
    ...input,
    id_laboratorio: nextId(laboratorios, (l) => l.id_laboratorio),
  };
  writeCollection("laboratorios", [...laboratorios, nuevo]);
  return nuevo;
}

export async function updateLaboratorio(id: number, input: LaboratorioInput): Promise<Laboratorio> {
  await delay();
  const laboratorios = readCollection<Laboratorio>("laboratorios", LABORATORIOS_SEED);
  const actualizado: Laboratorio = { ...input, id_laboratorio: id };
  writeCollection(
    "laboratorios",
    laboratorios.map((l) => (l.id_laboratorio === id ? actualizado : l))
  );
  return actualizado;
}

export async function deleteLaboratorio(id: number): Promise<void> {
  await delay();
  const enUso = medicamentosUsando((m) => m.id_laboratorio === id);
  if (enUso > 0) {
    throw new ApiError(
      `No se puede eliminar: ${enUso} medicamento(s) usan este laboratorio.`,
      409
    );
  }
  const laboratorios = readCollection<Laboratorio>("laboratorios", LABORATORIOS_SEED);
  writeCollection(
    "laboratorios",
    laboratorios.filter((l) => l.id_laboratorio !== id)
  );
}
