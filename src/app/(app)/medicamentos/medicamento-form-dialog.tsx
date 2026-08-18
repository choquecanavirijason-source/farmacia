"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMedicamento, updateMedicamento, type MedicamentoInput } from "@/lib/api/medicamentos";
import { ApiError } from "@/lib/api/client";
import type { Categoria, Laboratorio, Medicamento, Presentacion } from "@/lib/types";

interface MedicamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicamento?: Medicamento | null;
  categorias: Categoria[];
  presentaciones: Presentacion[];
  laboratorios: Laboratorio[];
  onSaved: (medicamento: Medicamento) => void;
}

interface FormState {
  codigo: string;
  nombre: string;
  concentracion: string;
  id_categoria: string;
  id_presentacion: string;
  id_laboratorio: string;
  precio_venta: string;
  stock_minimo: string;
  requiere_receta: boolean;
  estado: "activo" | "inactivo";
}

const EMPTY_FORM: FormState = {
  codigo: "",
  nombre: "",
  concentracion: "",
  id_categoria: "",
  id_presentacion: "",
  id_laboratorio: "",
  precio_venta: "",
  stock_minimo: "",
  requiere_receta: false,
  estado: "activo",
};

function medicamentoToForm(medicamento: Medicamento): FormState {
  return {
    codigo: medicamento.codigo,
    nombre: medicamento.nombre,
    concentracion: medicamento.concentracion,
    id_categoria: String(medicamento.id_categoria),
    id_presentacion: String(medicamento.id_presentacion),
    id_laboratorio: String(medicamento.id_laboratorio),
    precio_venta: String(medicamento.precio_venta),
    stock_minimo: String(medicamento.stock_minimo),
    requiere_receta: medicamento.requiere_receta,
    estado: medicamento.estado,
  };
}

/**
 * Contenido del formulario, montado solo mientras el diálogo está abierto.
 * `MedicamentoFormDialog` le pasa una `key` distinta por registro (o "new"),
 * así el estado inicial siempre nace correcto sin sincronizar por efecto.
 */
function MedicamentoFormBody({
  onOpenChange,
  medicamento,
  categorias,
  presentaciones,
  laboratorios,
  onSaved,
}: Omit<MedicamentoFormDialogProps, "open">) {
  const isEditing = Boolean(medicamento);
  const [form, setForm] = useState<FormState>(() =>
    medicamento ? medicamentoToForm(medicamento) : EMPTY_FORM
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (
      !form.codigo.trim() ||
      !form.nombre.trim() ||
      !form.concentracion.trim() ||
      !form.id_categoria ||
      !form.id_presentacion ||
      !form.id_laboratorio
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    const precio = Number(form.precio_venta);
    if (!Number.isFinite(precio) || precio <= 0) {
      setError("El precio de venta debe ser un número mayor a 0.");
      return;
    }

    const stockMinimo = Number(form.stock_minimo);
    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
      setError("El stock mínimo debe ser un número entero mayor o igual a 0.");
      return;
    }

    const input: MedicamentoInput = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      concentracion: form.concentracion.trim(),
      id_categoria: Number(form.id_categoria),
      id_presentacion: Number(form.id_presentacion),
      id_laboratorio: Number(form.id_laboratorio),
      precio_venta: precio,
      stock_minimo: stockMinimo,
      requiere_receta: form.requiere_receta,
      estado: form.estado,
    };

    setSaving(true);
    try {
      const saved = medicamento
        ? await updateMedicamento(medicamento.id_medicamento, input)
        : await createMedicamento(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el medicamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar medicamento" : "Nuevo medicamento"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Actualiza los datos del medicamento."
            : "Completa los datos para agregarlo al catálogo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={form.codigo}
              onChange={(e) => update("codigo", e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="concentracion">Concentración</Label>
            <Input
              id="concentracion"
              placeholder="500 mg"
              value={form.concentracion}
              onChange={(e) => update("concentracion", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="id_categoria">Categoría</Label>
            <Select
              value={form.id_categoria}
              onValueChange={(value) => update("id_categoria", value as string)}
              disabled={saving}
            >
              <SelectTrigger id="id_categoria" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="id_presentacion">Presentación</Label>
            <Select
              value={form.id_presentacion}
              onValueChange={(value) => update("id_presentacion", value as string)}
              disabled={saving}
            >
              <SelectTrigger id="id_presentacion" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {presentaciones.map((p) => (
                  <SelectItem key={p.id_presentacion} value={String(p.id_presentacion)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="id_laboratorio">Laboratorio</Label>
            <Select
              value={form.id_laboratorio}
              onValueChange={(value) => update("id_laboratorio", value as string)}
              disabled={saving}
            >
              <SelectTrigger id="id_laboratorio" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {laboratorios.map((l) => (
                  <SelectItem key={l.id_laboratorio} value={String(l.id_laboratorio)}>
                    {l.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="precio_venta">Precio de venta (Bs)</Label>
            <Input
              id="precio_venta"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.precio_venta}
              onChange={(e) => update("precio_venta", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stock_minimo">Stock mínimo</Label>
            <Input
              id="stock_minimo"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.stock_minimo}
              onChange={(e) => update("stock_minimo", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Switch
              id="requiere_receta"
              checked={form.requiere_receta}
              onCheckedChange={(checked) => update("requiere_receta", checked)}
              disabled={saving}
            />
            <Label htmlFor="requiere_receta" className="font-normal">
              Requiere receta médica
            </Label>
          </div>

          {isEditing ? (
            <div className="flex min-w-40 flex-col gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(value) => update("estado", value as FormState["estado"])}
                disabled={saving}
              >
                <SelectTrigger id="estado" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm wrap-break-word text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Guardando…
              </>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Crear medicamento"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function MedicamentoFormDialog({ open, onOpenChange, ...bodyProps }: MedicamentoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {open ? (
          <MedicamentoFormBody
            key={bodyProps.medicamento?.id_medicamento ?? "new"}
            onOpenChange={onOpenChange}
            {...bodyProps}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
