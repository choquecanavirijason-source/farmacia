"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Borde de luz angular (edge light): gradiente diagonal blanco -> transparente vía padding-box.
    <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-white/70 via-white/20 to-transparent p-px shadow-[0_25px_70px_-20px_rgba(15,23,42,0.35)]">
      {/* Panel de cristal: fondo translúcido + blur, con textura de ruido y sombra interior para dar grosor. */}
      <div className="relative overflow-hidden rounded-[calc(var(--radius-3xl)-1px)] bg-background/75 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-2xl">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.035] mix-blend-overlay" />

        <div className="relative">
          <CardHeader className="items-center gap-2 pt-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Pill className="size-6" aria-hidden />
            </div>
            {/* Guardia de contraste: título/labels usan foreground sólido, nunca opacidad reducida sobre el cristal. */}
            <CardTitle className="text-xl font-semibold tracking-tight text-balance text-foreground">
              Farmacia Juan de Dios
            </CardTitle>
            <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  name="usuario"
                  autoComplete="username"
                  autoFocus
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  disabled={loading}
                  className="bg-background/80"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={loading}
                  className="bg-background/80"
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm wrap-break-word text-destructive">
                  {error}
                </p>
              ) : null}
            </CardContent>

            <CardFooter className="flex-col gap-3 pb-8">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Ingresando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
              <p className="text-center text-xs text-balance text-muted-foreground">
                Acceso restringido al personal autorizado de la farmacia.
              </p>
            </CardFooter>
          </form>
        </div>
      </div>
    </div>
  );
}
