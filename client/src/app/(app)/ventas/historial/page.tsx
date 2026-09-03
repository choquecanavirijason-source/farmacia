"use client";

import { SalesHistory } from "../sales-history";

export default function VentasHistorialPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Historial de Ventas</h1>
        <p className="text-sm text-muted-foreground">Consulta, anula y reimprime comprobantes de ventas registradas.</p>
      </div>

      <SalesHistory />
    </div>
  );
}
