export interface IRole {
  id: number;
  name: string;
  guard_name: string;
  permissions?: string[];
  permissions_count?: number;
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface IRoleRequest {
  name: string;
  permissions?: string[];
}

export interface IRoleFormInput {
  name: string;
  permissions: string[];
}

export interface IRoleTableEdit {
  name?: string;
}

export type RoleTableEditableField = keyof IRoleTableEdit;
