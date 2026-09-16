export type RoleName = "ADMINISTRADOR" | "VENDEDOR" | "CLIENTE" | "administrator" | "seller" | "cliente";

export interface ISession {
  id_usuario: number;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "VENDEDOR";
  token: string;
}
