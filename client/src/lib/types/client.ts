// Entidad completa para lectura de datos y respuestas del servidor
export interface IClient {
  id: number;
  firstname: string;
  lastname: string;
  ci: string | null;
  nit: string | null;
  phone: string | null;
  address: string | null;
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
export interface IClientFormInput {
  firstname: string;
  lastname: string;
  ci?: string | null;
  nit?: string | null;
  phone?: string | null;
  address?: string | null;
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface IClientTableEdit {
  firstname?: string;
  lastname?: string;
  ci?: string | null;
  nit?: string | null;
  phone?: string | null;
  address?: string | null;
}

// Claves de campos permitidos para edición directa en tabla
export type ClientTableEditableField = keyof IClientTableEdit;

// Payload enviado a la API para registrar o actualizar clientes
export type IClientRequest = IClientFormInput;
