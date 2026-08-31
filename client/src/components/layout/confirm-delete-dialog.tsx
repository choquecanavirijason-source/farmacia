"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api/api-error";
import { toast } from "sonner";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => Promise<void>;
}

/** AlertDialog de confirmación reutilizable para acciones destructivas de cualquier CRUD. */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="wrap-break-word">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={(e) => {
            e.preventDefault();
            handleConfirm();
          }}>
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Eliminando…
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
