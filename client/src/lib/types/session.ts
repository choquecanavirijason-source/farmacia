export type RoleName = "ADMINISTRADOR" | "VENDEDOR" | "administrator" | "seller";

export interface ISession {
  id_usuario: number;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "VENDEDOR";
  token: string;
}
