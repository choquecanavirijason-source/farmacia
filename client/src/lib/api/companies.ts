import apiClient from "@/config/axios";
import type { ICompany, ICompanyRequest } from "@/lib/types/company";
import type { IApiResponse } from "@/lib/types/api";

let companyPromise: Promise<ICompany> | null = null;

export const fetchCompany = async (forceRefresh = false): Promise<ICompany> => {
  if (!forceRefresh && companyPromise) return companyPromise;

  companyPromise = apiClient
    .get<{ data: ICompany }>("/company")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        companyPromise = null;
      }, 5000);
    });

  return companyPromise;
};

export const updateCompany = async (data: ICompanyRequest): Promise<ICompany> => {
  companyPromise = null;
  const res = await apiClient.put<IApiResponse<ICompany>>("/company", data);
  return res.data.data;
};

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
