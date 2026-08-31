// Diccionario de traducción de nombres de modelos para la vista de usuario
export const MODEL_LABELS: Record<string, string> = {
  Client: "Cliente",
  Medicament: "Medicamento",
  Category: "Categoría",
  Presentation: "Presentación",
  Laboratory: "Laboratorio",
  Supplier: "Proveedor",
  User: "Usuario",
  Sale: "Venta",
  Purchase: "Compra",
  CashRegister: "Caja",
  Batch: "Lote",
  Company: "Empresa",
  PaymentMethod: "Método de Pago",
};

// Diccionario de traducción de atributos y campos para la vista de usuario
export const FIELD_LABELS: Record<string, string> = {
  firstname: "Nombre",
  lastname: "Apellido",
  name: "Nombre",
  username: "Usuario",
  email: "Correo Electrónico",
  ci: "C.I.",
  nit: "NIT",
  phone: "Teléfono",
  address: "Dirección",
  country: "País",
  description: "Descripción",
  code: "Código",
  concentration: "Concentración",
  price: "Precio de Venta",
  min_stock: "Stock Mínimo",
  requires_prescription: "Requiere Receta Médica",
  status: "Estado",
  state: "Estado",
  batch_number: "N° de Lote",
  expiration_date: "Fecha de Vencimiento",
  current_quantity: "Cantidad Actual",
  purchase_price: "Precio de Compra",
  opening_date: "Fecha de Apertura",
  opened_at: "Fecha de Apertura",
  opening_amount: "Monto Inicial",
  closing_date: "Fecha de Cierre",
  closed_at: "Fecha de Cierre",
  closing_amount: "Monto de Cierre",
  expected_closing_amount: "Monto Esperado",
  invoice_number: "N° de Factura",
  purchase_date: "Fecha de Compra",
  sold_at: "Fecha de Venta",
  total: "Total",
  created_id: "Creado por (ID)",
  updated_id: "Actualizado por (ID)",
  deleted_id: "Eliminado por (ID)",
  restored_id: "Restaurado por (ID)",
  created_at: "Fecha de Creación",
  updated_at: "Fecha de Modificación",
  deleted_at: "Fecha de Eliminación",
  restored_at: "Fecha de Restauración",
};

// Traduce el nombre del modelo o retorna el original formateado
export function getModelLabel(modelName: string): string {
  return MODEL_LABELS[modelName] || modelName;
}

// Traduce el nombre del campo o lo formatea
export function getFieldLabel(fieldName: string): string {
  if (FIELD_LABELS[fieldName]) {
    return FIELD_LABELS[fieldName];
  }
  return fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Formatea los valores a texto entendible para el usuario en español
export function formatValueForDisplay(val: any): string {
  if (val === null || val === undefined || val === "") {
    return "(Vacío)";
  }
  if (typeof val === "boolean") {
    return val ? "Sí" : "No";
  }
  if (val === "active") return "Activo";
  if (val === "inactive") return "Inactivo";
  if (val === "open") return "Abierta";
  if (val === "closed") return "Cerrada";
  if (val === "voided") return "Anulada";
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return String(val);
}
