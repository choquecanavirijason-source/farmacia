// Entidad completa para lectura de datos y respuestas del servidor
export interface IUser {
  id: number;
  name: string;
  email: string;
  state: "active" | "inactive";
  roles?: { id: number; name: string }[];
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
export interface IUserFormInput {
  name: string;
  email: string;
  password?: string;
  role: "administrator" | "seller";
  state: "active" | "inactive";
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface IUserTableEdit {
  name?: string;
  email?: string;
  state?: "active" | "inactive";
}

// Claves de campos permitidos para edición directa en tabla
export type UserTableEditableField = keyof IUserTableEdit;

// Payload enviado a la API para registrar o actualizar usuarios
export type IUserRequest = {
  name: string;
  email: string;
  password?: string;
  role?: string;
  state?: "active" | "inactive";
};
