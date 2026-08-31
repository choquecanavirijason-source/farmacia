// Entidad completa para lectura de datos y respuestas del servidor
export interface ICategory {
  id: number;
  name: string;
  description: string | null;
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
export interface ICategoryFormInput {
  name: string;
  description?: string | null;
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface ICategoryTableEdit {
  name?: string;
  description?: string | null;
}

// Claves de campos permitidos para edición directa en tabla
export type CategoryTableEditableField = keyof ICategoryTableEdit;

// Payload enviado a la API para registrar o actualizar categorías
export type ICategoryRequest = ICategoryFormInput;
