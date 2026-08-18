"use client";

import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteMedicamento } from "@/lib/api/medicamentos";
import type { Medicamento } from "@/lib/types";

interface DeleteMedicamentoDialogProps {
  medicamento: Medicamento | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: number) => void;
}

export function DeleteMedicamentoDialog({
  medicamento,
  onOpenChange,
  onDeleted,
}: DeleteMedicamentoDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={Boolean(medicamento)}
      onOpenChange={onOpenChange}
      title="¿Eliminar medicamento?"
      description={
        <>
          Se eliminará <strong>{medicamento?.nombre}</strong> ({medicamento?.codigo}) del
          catálogo. Esta acción no se puede deshacer.
        </>
      }
      onConfirm={async () => {
        if (!medicamento) return;
        await deleteMedicamento(medicamento.id_medicamento);
        onDeleted(medicamento.id_medicamento);
      }}
    />
  );
}
