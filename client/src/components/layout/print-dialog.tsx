"use client";

import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Contenido a imprimir — se envuelve en `.print-area` (ver globals.css). */
  children: ReactNode;
  /** Ancho máximo del área imprimible, ej. "max-w-2xl". Default: contenido ancho para tablas. */
  printAreaClassName?: string;
}

/** Diálogo genérico reutilizable para imprimir cualquier vista (reportes, recibos, etc.) centrada en la hoja. */
export function PrintDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  printAreaClassName = "max-w-3xl",
}: PrintDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="no-print">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="no-print w-fit gap-1.5 self-end"
          onClick={() => window.print()}
        >
          <Printer className="size-4" aria-hidden />
          Imprimir
        </Button>

        <div className={`print-area mx-auto w-full ${printAreaClassName}`}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("es-BO", { dateStyle: "medium" })}
            </span>
          </div>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
