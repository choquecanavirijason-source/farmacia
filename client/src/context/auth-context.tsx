"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import { switchActiveBranch } from "@/lib/api/branches";
import { getAuthToken } from "@/config/axios";
import type { RolNombre } from "@/lib/types";
import type { IBranchSummary } from "@/lib/types/branch";

export interface AuthUser {
  id: number;
  name: string;
  username?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  state?: string;
  roles?: Array<{ id?: number; name: string }>;
  active_branch_id?: number | null;
  branches?: IBranchSummary[];
}

export interface AuthContextType {
  user: AuthUser | null;
  rol: RolNombre;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  can: (permission: string | string[]) => boolean;
  canAny: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  login: (loginVal: string, passwordVal: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchBranch: (branchId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRole(user: AuthUser | null): RolNombre {
  if (!user?.roles || user.roles.length === 0) return "VENDEDOR";
  const firstRole = user.roles[0]?.name?.toLowerCase();
  return firstRole === "administrator" || firstRole === "admin" ? "ADMINISTRADOR" : "VENDEDOR";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUser() {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getCurrentUser();
      const userData = data?.user ?? data;
      const userPermissions = data?.permissions ?? [];

      setUser(userData);
      setPermissions(userPermissions);
    } catch {
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  async function login(loginVal: string, passwordVal: string) {
    setIsLoading(true);
    try {
      const data = await apiLogin(loginVal, passwordVal);
      const userData = data?.user ?? (data as any);
      const userPermissions = data?.permissions ?? [];
      setUser(userData);
      setPermissions(userPermissions);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      setPermissions([]);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  async function switchBranch(branchId: number) {
    await switchActiveBranch(branchId);
    // Recarga completa: hay demasiadas pantallas (POS, Caja, Lotes, Compras) que cargan
    // su inventario/datos una sola vez al montar. router.refresh() no las vuelve a pedir,
    // así que quedan mostrando datos de la sucursal anterior. Un reload duro garantiza
    // que todo se vuelva a pedir ya filtrado por la nueva sucursal activa.
    window.location.reload();
  }

  const rol = extractRole(user);
  const isAuthenticated = Boolean(user && getAuthToken());

  const isAdmin = user?.roles?.some(
    (r) => r.name?.toLowerCase() === "administrator" || r.name?.toLowerCase() === "admin"
  ) ?? false;

  const can = (permission: string | string[]): boolean => {
    if (!user) return false;
    if (isAdmin) return true; // Administrator has full access

    if (Array.isArray(permission)) {
      return permission.every((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  const canAny = (permissionList: string[]): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissionList.some((p) => permissions.includes(p));
  };

  const hasRole = (roleName: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((r) => r.name?.toLowerCase() === roleName.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rol,
        permissions,
        isLoading,
        isAuthenticated,
        can,
        canAny,
        hasRole,
        login,
        logout,
        refreshUser: fetchUser,
        switchBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
