"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";

export interface BranchViewContextType {
  /** Sucursal que las pantallas de consulta deben mostrar. `null` = todas las sucursales. */
  branchScope: number | null;
  setBranchScope: (branchId: number | null) => void;
}

const BranchViewContext = createContext<BranchViewContextType | undefined>(undefined);

/** Controla, en un solo lugar (el selector del Topbar), qué sucursal ven las pantallas
 * de consulta (Dashboard, Reportes, Lotes, Ventas, Compras, Caja): una específica o todas.
 * Es independiente de la sucursal ACTIVA del usuario (esa determina dónde vende/compra). */
export function BranchViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branchScope, setBranchScope] = useState<number | null>(null);

  // Al cargar la sesión (o cambiar de sucursal activa), arranca viendo esa sucursal por defecto.
  useEffect(() => {
    if (user?.active_branch_id) {
      setBranchScope(user.active_branch_id);
    }
  }, [user?.active_branch_id]);

  return (
    <BranchViewContext.Provider value={{ branchScope, setBranchScope }}>
      {children}
    </BranchViewContext.Provider>
  );
}

export function useBranchView(): BranchViewContextType {
  const context = useContext(BranchViewContext);
  if (!context) {
    throw new Error("useBranchView debe ser utilizado dentro de un BranchViewProvider");
  }
  return context;
}
