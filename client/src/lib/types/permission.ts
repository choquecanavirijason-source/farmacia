export interface IPermission {
  id?: number;
  name: string;
  guard_name?: string;
}

export interface IPermissionItem {
  name: string;
  label: string;
}

export interface IPermissionGroup {
  title: string;
  description: string;
  permissions: IPermissionItem[];
}

export interface IPermissionsResponse {
  all: string[];
  groups: Record<string, IPermissionGroup>;
}
