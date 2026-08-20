import { apiFetch } from "@/lib/api/http";
import type { Empresa } from "@/lib/types";

interface EmpresaApi {
  nombre: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  logo_path: string | null;
}

function toEmpresa(e: EmpresaApi): Empresa {
  return {
    nombre: e.nombre,
    nit: e.nit ?? "",
    direccion: e.direccion ?? "",
    telefono: e.telefono ?? "",
    logo: e.logo_path,
  };
}

export async function fetchEmpresa(): Promise<Empresa> {
  const data = await apiFetch<EmpresaApi>("/empresa");
  return toEmpresa(data);
}

export async function updateEmpresa(input: Empresa): Promise<Empresa> {
  const data = await apiFetch<EmpresaApi>("/empresa", {
    method: "PUT",
    body: JSON.stringify({
      nombre: input.nombre,
      nit: input.nit,
      direccion: input.direccion,
      telefono: input.telefono,
      logo: input.logo,
    }),
  });
  return toEmpresa(data);
}
