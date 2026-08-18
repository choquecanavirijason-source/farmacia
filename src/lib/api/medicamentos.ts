import { ApiError, delay, readCollection, writeCollection } from "@/lib/api/client";
import { fetchCategorias, fetchLaboratorios, fetchPresentaciones } from "@/lib/api/catalogos";
import type { Medicamento } from "@/lib/types";

export { fetchCategorias, fetchLaboratorios, fetchPresentaciones };

const MEDICAMENTOS_SEED: Medicamento[] = [
  {
    id_medicamento: 1,
    codigo: "MED-0001",
    nombre: "Paracetamol",
    concentracion: "500 mg",
    precio_venta: 12.5,
    stock_minimo: 20,
    requiere_receta: false,
    estado: "activo",
    id_categoria: 1,
    id_presentacion: 1,
    id_laboratorio: 1,
  },
  {
    id_medicamento: 2,
    codigo: "MED-0002",
    nombre: "Amoxicilina",
    concentracion: "500 mg",
    precio_venta: 28,
    stock_minimo: 15,
    requiere_receta: true,
    estado: "activo",
    id_categoria: 2,
    id_presentacion: 4,
    id_laboratorio: 3,
  },
  {
    id_medicamento: 3,
    codigo: "MED-0003",
    nombre: "Jarabe para la tos Bisolvon",
    concentracion: "8 mg/5 ml",
    precio_venta: 35.9,
    stock_minimo: 10,
    requiere_receta: false,
    estado: "activo",
    id_categoria: 3,
    id_presentacion: 2,
    id_laboratorio: 2,
  },
  {
    id_medicamento: 4,
    codigo: "MED-0004",
    nombre: "Ibuprofeno",
    concentracion: "400 mg",
    precio_venta: 15.5,
    stock_minimo: 25,
    requiere_receta: false,
    estado: "activo",
    id_categoria: 4,
    id_presentacion: 1,
    id_laboratorio: 1,
  },
  {
    id_medicamento: 5,
    codigo: "MED-0005",
    nombre: "Diclofenaco inyectable",
    concentracion: "75 mg/3 ml",
    precio_venta: 9.5,
    stock_minimo: 12,
    requiere_receta: true,
    estado: "inactivo",
    id_categoria: 4,
    id_presentacion: 3,
    id_laboratorio: 3,
  },
];

const MEDICAMENTOS_KEY = "medicamentos";

export async function fetchMedicamentos(): Promise<Medicamento[]> {
  await delay();
  return readCollection<Medicamento>(MEDICAMENTOS_KEY, MEDICAMENTOS_SEED);
}

export type MedicamentoInput = Omit<Medicamento, "id_medicamento">;

function nextId(medicamentos: Medicamento[]): number {
  return medicamentos.reduce((max, m) => Math.max(max, m.id_medicamento), 0) + 1;
}

function assertCodigoUnico(medicamentos: Medicamento[], codigo: string, ignoreId?: number) {
  const exists = medicamentos.some(
    (m) => m.codigo.toLowerCase() === codigo.toLowerCase() && m.id_medicamento !== ignoreId
  );
  if (exists) {
    throw new ApiError(`Ya existe un medicamento con el código "${codigo}".`, 409);
  }
}

export async function createMedicamento(input: MedicamentoInput): Promise<Medicamento> {
  await delay();
  const medicamentos = readCollection<Medicamento>(MEDICAMENTOS_KEY, MEDICAMENTOS_SEED);
  assertCodigoUnico(medicamentos, input.codigo);
  const nuevo: Medicamento = { ...input, id_medicamento: nextId(medicamentos) };
  writeCollection(MEDICAMENTOS_KEY, [...medicamentos, nuevo]);
  return nuevo;
}

export async function updateMedicamento(
  id: number,
  input: MedicamentoInput
): Promise<Medicamento> {
  await delay();
  const medicamentos = readCollection<Medicamento>(MEDICAMENTOS_KEY, MEDICAMENTOS_SEED);
  assertCodigoUnico(medicamentos, input.codigo, id);
  const actualizado: Medicamento = { ...input, id_medicamento: id };
  const next = medicamentos.map((m) => (m.id_medicamento === id ? actualizado : m));
  writeCollection(MEDICAMENTOS_KEY, next);
  return actualizado;
}

export async function deleteMedicamento(id: number): Promise<void> {
  await delay();
  const medicamentos = readCollection<Medicamento>(MEDICAMENTOS_KEY, MEDICAMENTOS_SEED);
  writeCollection(
    MEDICAMENTOS_KEY,
    medicamentos.filter((m) => m.id_medicamento !== id)
  );
}
