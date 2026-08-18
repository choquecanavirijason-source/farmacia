"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Building2, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { fetchEmpresa, updateEmpresa } from "@/lib/api/empresa";
import type { Empresa } from "@/lib/types";

const LOGO_MAX_BYTES = 1_000_000;

export default function ConfiguracionPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEmpresa().then(setEmpresa);
  }, []);

  function update<K extends keyof Empresa>(key: K, value: Empresa[K]) {
    setEmpresa((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("El logo debe ser una imagen.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("La imagen es muy pesada (máx. 1 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => update("logo", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!empresa) return;
    setError(null);

    if (!empresa.nombre.trim() || !empresa.nit.trim()) {
      setError("Nombre y NIT son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const saved = await updateEmpresa(empresa);
      setEmpresa(saved);
      toast.success("Datos de la empresa actualizados.");
    } catch {
      setError("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Configuración de la Empresa</h1>
        <p className="text-sm text-muted-foreground">
          Estos datos se usarán en los comprobantes y facturas de venta.
        </p>
      </div>

      {empresa === null ? (
        <Card className="max-w-2xl">
          <CardContent className="flex flex-col gap-4 pt-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {empresa.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data URL local, sin optimización de Next Image
                    <img src={empresa.logo} alt="Logo de la empresa" className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-8" aria-hidden />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={saving}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="size-4" aria-hidden />
                      {empresa.logo ? "Cambiar logo" : "Subir logo"}
                    </Button>
                    {empresa.logo ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={saving}
                        onClick={() => update("logo", null)}
                        aria-label="Quitar logo"
                      >
                        <X className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG o JPG, máx. 1 MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nombre">Nombre de la empresa</Label>
                  <Input
                    id="nombre"
                    value={empresa.nombre}
                    onChange={(e) => update("nombre", e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nit">NIT</Label>
                  <Input
                    id="nit"
                    value={empresa.nit}
                    onChange={(e) => update("nit", e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={empresa.direccion}
                    onChange={(e) => update("direccion", e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={empresa.telefono}
                    onChange={(e) => update("telefono", e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              {error ? (
                <p role="alert" className="text-sm wrap-break-word text-destructive">
                  {error}
                </p>
              ) : null}
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Guardando…
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
