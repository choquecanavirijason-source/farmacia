import { apiFetch } from "@/lib/api/http";
import { fetchCategorias, fetchLaboratorios, fetchPresentaciones } from "@/lib/api/catalogos";
import type { Medicamento, MedicamentoEstado } from "@/lib/types";

export { fetchCategorias, fetchLaboratorios, fetchPresentaciones };

interface MedicamentoApi {
  id_medicamento: number;
  codigo: string;
  nombre: string;
  concentracion: string | null;
  precio_venta: string;
  stock_minimo: number;
  requiere_receta: boolean;
  estado: MedicamentoEstado;
  id_categoria: number;
  id_presentacion: number;
  id_laboratorio: number;
}

function toMedicamento(m: MedicamentoApi): Medicamento {
  return {
    id_medicamento: m.id_medicamento,
    codigo: m.codigo,
    nombre: m.nombre,
    concentracion: m.concentracion ?? "",
    precio_venta: Number(m.precio_venta),
    stock_minimo: m.stock_minimo,
    requiere_receta: m.requiere_receta,
    estado: m.estado,
    id_categoria: m.id_categoria,
    id_presentacion: m.id_presentacion,
    id_laboratorio: m.id_laboratorio,
  };
}

export async function fetchMedicamentos(): Promise<Medicamento[]> {
  const data = await apiFetch<MedicamentoApi[]>("/medicamentos");
  return data.map(toMedicamento);
}

export type MedicamentoInput = Omit<Medicamento, "id_medicamento">;

export async function createMedicamento(input: MedicamentoInput): Promise<Medicamento> {
  const data = await apiFetch<MedicamentoApi>("/medicamentos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toMedicamento(data);
}

export async function updateMedicamento(id: number, input: MedicamentoInput): Promise<Medicamento> {
  const data = await apiFetch<MedicamentoApi>(`/medicamentos/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return toMedicamento(data);
}

export async function deleteMedicamento(id: number): Promise<void> {
  await apiFetch<void>(`/medicamentos/${id}`, { method: "DELETE" });
}
