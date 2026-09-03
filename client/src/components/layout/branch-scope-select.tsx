"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useBranchView } from "@/context/branch-view-context";
import { cn } from "@/lib/utils";

interface BranchScopeSelectProps {
  className?: string;
}

/** Selector único de sucursal, vive una sola vez en el Topbar.
 * - Elegir una sucursal específica cambia dónde operas (vendes/compras/abres caja) Y qué ves
 *   en las pantallas de consulta — ambas cosas quedan sincronizadas.
 * - Elegir "Todas las sucursales" solo cambia qué ves; sigues operando en tu última sucursal activa,
 *   porque una venta o compra siempre tiene que quedar registrada en una sucursal concreta. */
export function BranchScopeSelect({ className }: BranchScopeSelectProps) {
  const { user, switchBranch } = useAuth();
  const { branchScope, setBranchScope } = useBranchView();
  const [switching, setSwitching] = useState(false);
  const branches = user?.branches ?? [];

  if (branches.length <= 1) return null;

  const viewingAll = branchScope === null;
  const activeBranchName = branches.find((b) => b.id === user?.active_branch_id)?.name;
  const triggerLabel = viewingAll
    ? "Todas las sucursales"
    : branches.find((b) => b.id === branchScope)?.name ?? "Sucursal";

  async function handleSelectBranch(branchId: number) {
    if (branchId === user?.active_branch_id) {
      setBranchScope(branchId);
      return;
    }
    setSwitching(true);
    try {
      // switchBranch recarga la página al terminar con éxito, así que el
      // código después del await solo se alcanza si la operación falló.
      await switchBranch(branchId);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo cambiar de sucursal."
      );
    } finally {
      setSwitching(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("items-center gap-1.5 text-xs font-medium", className)}
            disabled={switching}
          />
        }
      >
        <Building2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="max-w-40 truncate">{triggerLabel}</span>
        <ChevronDown className="size-3 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Sucursal
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setBranchScope(null)}
          className="flex items-center justify-between gap-2 cursor-pointer"
        >
          <span className="truncate text-xs">Todas las sucursales</span>
          {viewingAll && <Check className="size-3.5 shrink-0 text-primary" aria-hidden />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {branches.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => handleSelectBranch(b.id)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="truncate text-xs">{b.name}</span>
            {branchScope === b.id && <Check className="size-3.5 shrink-0 text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
        {viewingAll && activeBranchName && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-[11px] text-muted-foreground text-balance">
              Ventas, compras y caja se siguen registrando en <strong>{activeBranchName}</strong>.
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
