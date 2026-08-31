// Entidad completa para lectura de datos y respuestas del servidor
export interface ISupplier {
  id: number;
  name: string;
  nit: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
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
export interface ISupplierFormInput {
  name: string;
  nit?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface ISupplierTableEdit {
  name?: string;
  nit?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}

// Claves de campos permitidos para edición directa en tabla
export type SupplierTableEditableField = keyof ISupplierTableEdit;

// Payload enviado a la API para registrar o actualizar proveedores
export type ISupplierRequest = ISupplierFormInput;
