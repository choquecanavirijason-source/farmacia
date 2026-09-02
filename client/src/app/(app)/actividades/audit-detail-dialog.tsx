"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { IAudit } from "@/lib/types/audit";
import { Globe, Monitor, User as UserIcon, Calendar, ArrowRight } from "lucide-react";
import { getFieldLabel, getModelLabel, formatValueForDisplay } from "@/lib/utils/audit-helpers";

interface AuditDetailDialogProps {
  audit: IAudit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal para visualizar el detalle completo de una auditoría
export function AuditDetailDialog({
  audit,
  open,
  onOpenChange,
}: AuditDetailDialogProps) {
  if (!audit) return null;

  // Variantes visuales para los distintos tipos de eventos
  const eventVariant: Record<string, { label: string; className: string }> = {
    created: {
      label: "Creación",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    updated: {
      label: "Modificación",
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    deleted: {
      label: "Eliminación",
      className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    },
    restored: {
      label: "Restauración",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
  };

  const currentEvent = eventVariant[audit.event] || {
    label: audit.event,
    className: "bg-muted text-muted-foreground",
  };

  // Obtener todas las claves únicas involucradas en la auditoría
  const oldKeys = Object.keys(audit.old_values || {});
  const newKeys = Object.keys(audit.new_values || {});
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys]));

  // "created" y "restored" no tienen un "antes" real que comparar: el registro
  // simplemente pasa a existir (o vuelve a existir) con esos valores. Mostrar
  // "Valor Anterior: (Vacío)" en cada fila confunde, como si todo hubiera estado
  // vacío antes — se muestra solo el estado final, igual que para "created".
  const showOldValue = audit.event !== "created" && audit.event !== "restored";
  const showArrow = audit.event === "updated";
  const sectionTitle = audit.event === "restored"
    ? "Datos Restaurados"
    : audit.event === "created"
      ? "Valores Registrados"
      : audit.event === "deleted"
        ? "Valores Eliminados"
        : "Valores Modificados";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={currentEvent.className}>
              {currentEvent.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              ID #{audit.id}
            </span>
          </div>
          <DialogTitle className="text-lg font-semibold">
            Detalle de Actividad en {getModelLabel(audit.auditable_type)} #{audit.auditable_id}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Información registrada de la acción realizada por el usuario en el sistema.
          </DialogDescription>
        </DialogHeader>

        {/* Metadatos de la sesión y el usuario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-xs border">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              <strong>Usuario:</strong>{" "}
              {audit.user ? `${audit.user.name} (${audit.user.email})` : "Sistema / Proceso Interno"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <span>
              <strong>Fecha y Hora:</strong>{" "}
              {new Date(audit.created_at).toLocaleString("es-ES")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground shrink-0" />
            <span className="font-mono">
              <strong>Dirección IP:</strong> {audit.ip_address || "No disponible"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate" title={audit.user_agent || ""}>
              <strong>Navegador:</strong> {audit.user_agent || "No disponible"}
            </span>
          </div>
        </div>

        {/* Tabla de cambios y valores modificados */}
        <div className="mt-3 space-y-2">
          <h4 className="text-sm font-semibold tracking-tight">
            {sectionTitle} ({allKeys.length})
          </h4>

          {allKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center bg-muted/20 rounded">
              No se registraron diferencias específicas en los campos.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-2.5 text-left font-medium">Campo</th>
                    {showOldValue && (
                      <th className="p-2.5 text-left font-medium">
                        {audit.event === "deleted" ? "Valor Eliminado" : "Valor Anterior"}
                      </th>
                    )}
                    {showArrow && (
                      <th className="p-2.5 text-center w-6 font-medium"></th>
                    )}
                    {audit.event !== "deleted" && (
                      <th className="p-2.5 text-left font-medium">
                        {audit.event === "restored" ? "Valor Restaurado" : "Valor Nuevo"}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allKeys.map((key) => {
                    const oldVal = audit.old_values?.[key];
                    const newVal = audit.new_values?.[key];
                    const hasChanged = oldVal !== newVal;

                    return (
                      <tr key={key} className={hasChanged && audit.event === "updated" ? "bg-amber-500/5" : undefined}>
                        <td className="p-2.5 font-medium text-foreground">
                          {getFieldLabel(key)}
                        </td>
                        {showOldValue && (
                          <td className="p-2.5 text-rose-600 dark:text-rose-400 max-w-[200px] break-all">
                            {formatValueForDisplay(oldVal)}
                          </td>
                        )}
                        {showArrow && (
                          <td className="p-2.5 text-center text-muted-foreground">
                            <ArrowRight className="size-3.5 mx-auto" />
                          </td>
                        )}
                        {audit.event !== "deleted" && (
                          <td className="p-2.5 text-emerald-600 dark:text-emerald-400 max-w-[200px] break-all font-medium">
                            {formatValueForDisplay(newVal)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
