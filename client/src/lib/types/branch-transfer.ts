// Entidad completa para lectura de datos y respuestas del servidor
export interface IBranchTransfer {
  id: number;
  medicament_id: number;
  from_branch_id: number;
  to_branch_id: number;
  source_batch_id: number;
  destination_batch_id: number;
  quantity: number;
  reason: string | null;
  medicament?: { id: number; name: string; code: string };
  from_branch?: { id: number; name: string };
  to_branch?: { id: number; name: string };
  created_at: string;
}

// Payload enviado a la API para registrar un traspaso
export interface IBranchTransferRequest {
  batch_id: number;
  to_branch_id: number;
  quantity: number;
  reason?: string;
}
