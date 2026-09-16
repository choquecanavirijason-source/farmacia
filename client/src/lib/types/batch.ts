import type { IMedicament } from "./medicament";

// Entidad completa para lectura de datos y respuestas del servidor
export interface IBatch {
  id: number;
  batch_number: string;
  expiration_date: string;
  current_quantity: number;
  purchase_price: number | string;
  medicament_id: number;
  medicament?: IMedicament;
  branch_id?: number;
  branch?: { id: number; name: string };
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

// Tipado para datos del Formulario Modal (Crear / Editar)
export interface IBatchFormInput {
  medicament_id: number;
  batch_number: string;
  expiration_date: string;
  current_quantity: number;
  purchase_price: number;
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface IBatchTableEdit {
  batch_number?: string;
  expiration_date?: string;
  purchase_price?: number;
}

// Claves de campos permitidos para edición directa en tabla
export type BatchTableEditableField = keyof IBatchTableEdit;

// Payload enviado a la API para registrar o actualizar lotes
export type IBatchRequest = IBatchFormInput;
