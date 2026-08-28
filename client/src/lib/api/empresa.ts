import { apiFetch } from "@/lib/api/http";
import type { Empresa } from "@/lib/types";

interface EmpresaApi {
  id: number;
  name: string;
  nit: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_path: string | null;
}

function toEmpresa(e: EmpresaApi): Empresa {
  return {
    nombre: e.name,
    nit: e.nit,
    direccion: e.address ?? "",
    telefono: e.phone ?? "",
    logo: e.logo_path,
  };
}

export async function fetchEmpresa(): Promise<Empresa> {
  const response = await apiFetch<{ data: EmpresaApi }>("/companies/1");
  return toEmpresa(response.data);
}

export async function updateEmpresa(input: Empresa): Promise<Empresa> {
  const response = await apiFetch<{ data: EmpresaApi }>("/companies/1", {
    method: "PUT",
    body: JSON.stringify({
      name: input.nombre,
      nit: input.nit,
      address: input.direccion,
      phone: input.telefono,
      logo_path: input.logo,
    }),
  });
  return toEmpresa(response.data);
}
