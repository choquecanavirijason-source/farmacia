import apiClient from "@/config/axios";
import type { ICompany, ICompanyRequest } from "@/lib/types/company";
import type { IApiResponse } from "@/lib/types/api";

export const fetchCompany = async (): Promise<ICompany> => {
  const res = await apiClient.get<{ data: ICompany }>("/company");
  return res.data.data;
};

export const updateCompany = async (data: ICompanyRequest): Promise<ICompany> => {
  const res = await apiClient.put<IApiResponse<ICompany>>("/company", data);
  return res.data.data;
};

// Aliases de compatibilidad
export const fetchEmpresa = async (): Promise<any> => {
  const c = await fetchCompany();
  return {
    ...c,
    id_empresa: c.id ?? 1,
    nombre: c.name,
    direccion: c.address ?? "",
    telefono: c.phone ?? "",
    logo: c.logo_path ?? c.logo ?? "",
  };
};

export const actualizarEmpresa = async (data: any): Promise<any> => {
  await updateCompany({
    name: data.nombre ?? data.name,
    nit: data.nit,
    address: data.direccion ?? data.address,
    phone: data.telefono ?? data.phone,
    email: data.email,
  });
  return fetchEmpresa();
};
