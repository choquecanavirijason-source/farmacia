import type { ICategory } from "./category";
import type { IPresentation } from "./presentation";
import type { ILaboratory } from "./laboratory";

// Entidad completa para lectura de datos y respuestas del servidor
export interface IMedicament {
  id: number;
  code: string;
  name: string;
  concentration: string;
  price: number | string;
  min_stock: number;
  requires_prescription: boolean;
  status: "active" | "inactive";
  category_id: number;
  presentation_id: number;
  laboratory_id: number;
  category?: ICategory;
  presentation?: IPresentation;
  laboratory?: ILaboratory;
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

// Tipado para datos del Formulario Modal (Crear / Editar completo)
export interface IMedicamentFormInput {
  code: string;
  name: string;
  concentration: string;
  category_id: number;
  presentation_id: number;
  laboratory_id: number;
  price: number;
  min_stock: number;
  requires_prescription: boolean;
  status: "active" | "inactive";
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface IMedicamentTableEdit {
  code?: string;
  name?: string;
  concentration?: string;
  price?: number;
  min_stock?: number;
  status?: "active" | "inactive";
}

// Claves de campos permitidos para edición directa en tabla
export type MedicamentTableEditableField = keyof IMedicamentTableEdit;

// Payload enviado a la API para registrar o actualizar medicamentos
export type IMedicamentRequest = IMedicamentFormInput;
