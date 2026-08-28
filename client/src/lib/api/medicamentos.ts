import { apiFetch } from "@/lib/api/http";
import {
  fetchCategorias,
  fetchLaboratorios,
  fetchPresentaciones,
} from "@/lib/api/catalogos";
import type { Medicamento, MedicamentoEstado } from "@/lib/types";

export { fetchCategorias, fetchLaboratorios, fetchPresentaciones };

interface MedicamentoApi {
  id: number;
  code: string;
  name: string;
  concentracion: string | null;
  price: string | number;
  min_stock: number;
  requires_prescription: boolean;
  status: "active" | "inactive";
  category_id: number;
  presentation_id: number;
  laboratory_id: number;
}

function toMedicamento(m: MedicamentoApi): Medicamento {
  return {
    id_medicamento: m.id,
    codigo: m.code,
    nombre: m.name,
    concentracion: m.concentracion ?? "",
    precio_venta: Number(m.price),
    stock_minimo: m.min_stock,
    requiere_receta: m.requires_prescription,
    estado: m.status === "active" ? "activo" : "inactivo",
    id_categoria: m.category_id,
    id_presentacion: m.presentation_id,
    id_laboratorio: m.laboratory_id,
  };
}

function toStatus(estado: MedicamentoEstado): "active" | "inactive" {
  return estado === "activo" ? "active" : "inactive";
}

export async function fetchMedicamentos(): Promise<Medicamento[]> {
  const response = await apiFetch<{ data: MedicamentoApi[] }>(
    "/medicaments?per_page=100",
  );
  return response.data.map(toMedicamento);
}

export type MedicamentoInput = Omit<Medicamento, "id_medicamento">;

export async function createMedicamento(
  input: MedicamentoInput,
): Promise<Medicamento> {
  const response = await apiFetch<{ data: MedicamentoApi }>("/medicaments", {
    method: "POST",
    body: JSON.stringify({
      code: input.codigo,
      name: input.nombre,
      concentration: input.concentracion,
      price: input.precio_venta,
      min_stock: input.stock_minimo,
      requires_prescription: input.requiere_receta,
      status: toStatus(input.estado),
      category_id: input.id_categoria,
      presentation_id: input.id_presentacion,
      laboratory_id: input.id_laboratorio,
    }),
  });
  return toMedicamento(response.data);
}

export async function updateMedicamento(
  id: number,
  input: MedicamentoInput,
): Promise<Medicamento> {
  const response = await apiFetch<{ data: MedicamentoApi }>(
    `/medicaments/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        code: input.codigo,
        name: input.nombre,
        concentration: input.concentracion,
        price: input.precio_venta,
        min_stock: input.stock_minimo,
        requires_prescription: input.requiere_receta,
        status: toStatus(input.estado),
        category_id: input.id_categoria,
        presentation_id: input.id_presentacion,
        laboratory_id: input.id_laboratorio,
      }),
    },
  );
  return toMedicamento(response.data);
}

export async function deleteMedicamento(id: number): Promise<void> {
  await apiFetch<void>(`/medicaments/${id}`, { method: "DELETE" });
}
