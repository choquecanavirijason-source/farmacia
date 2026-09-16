// Entidad completa para lectura de datos y respuestas del servidor
export interface IBranch {
  id: number;
  company_id: number;
  name: string;
  address: string | null;
  phone: string | null;
  status: "active" | "inactive";
  users_count?: number;
  users?: { id: number; name: string; pivot?: { is_default?: boolean } }[];
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

// Sucursal simplificada tal como viaja embebida en el usuario autenticado
export interface IBranchSummary {
  id: number;
  name: string;
}

// Tipado para datos del Formulario Modal (Crear / Editar)
export interface IBranchFormInput {
  name: string;
  address?: string | null;
  phone?: string | null;
  status?: "active" | "inactive";
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface IBranchTableEdit {
  name?: string;
  address?: string | null;
  phone?: string | null;
  status?: "active" | "inactive";
}

// Claves de campos permitidos para edición directa en tabla
export type BranchTableEditableField = keyof IBranchTableEdit;

// Payload enviado a la API para registrar o actualizar sucursales
export type IBranchRequest = IBranchFormInput;
