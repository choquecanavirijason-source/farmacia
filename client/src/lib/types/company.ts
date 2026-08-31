export interface ICompany {
  id?: number;
  name: string;
  nit: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_path?: string | null;
  logo?: string | null;
  created_id?: number | null;
  updated_id?: number | null;
  deleted_id?: number | null;
  restored_id?: number | null;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}

export type ICompanyRequest = {
  name: string;
  nit: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};
