"use client";

import { useAuth } from "@/context/auth-context";

export function usePermissions() {
  const { permissions, can, canAny, hasRole, user, rol, isLoading } = useAuth();

  return {
    permissions,
    can,
    canAny,
    hasRole,
    user,
    rol,
    isLoading,
  };
}
