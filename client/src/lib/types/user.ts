// Entidad completa para lectura de datos y respuestas del servidor
export interface IUser {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email: string;
  state?: "active" | "inactive";
  roles?: { id: number; name: string }[];
  role_names?: string[];
  active_branch_id?: number | null;
  branches?: { id: number; name: string; is_default: boolean }[];
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
  name?: string;
  firstname: string;
  lastname: string;
  username?: string;
  email: string;
  password?: string;
  role: string;
  roles?: string[];
}

// Tipado para Edición rápida en Celdas de la Tabla (Inline Editing)
export interface IUserTableEdit {
  name?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
}

// Claves de campos permitidos para edición directa en tabla
export type UserTableEditableField = keyof IUserTableEdit;

// Payload enviado a la API para registrar o actualizar usuarios
export type IUserRequest = {
  name?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email: string;
  password?: string;
  role?: string;
  roles?: string[];
  branch_ids?: number[];
  default_branch_id?: number | null;
};
