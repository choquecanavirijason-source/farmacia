"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Pill, User } from "lucide-react";
import { setClientSession } from "@/lib/auth/client-session";
import { apiFetch, setAuthToken } from "@/lib/api/http";
import type { Sesion } from "@/lib/types";
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

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{
        token: string;
        user: {
          id: number;
          name: string;
          email: string;
          roles: { name: string }[];
        };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      const sesion: Sesion = {
        id_usuario: data.user.id,
        nombre: data.user.name,
        usuario: data.user.email,
        rol:
          data.user.roles[0]?.name === "administrator"
            ? "ADMINISTRADOR"
            : "VENDEDOR",
        token: data.token,
      };
      setClientSession(sesion);
      setAuthToken(sesion.token);
      router.push(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      {/* Borde de luz angular (edge light): gradiente diagonal blanco -> transparente vía padding-box. */}
      <div className="relative w-full rounded-4xl bg-gradient-to-br from-white/80 via-white/25 to-transparent p-px shadow-[0_35px_90px_-25px_rgba(15,23,42,0.4)]">
        {/* Panel de cristal: fondo translúcido + blur, con textura de ruido y sombra interior para dar grosor. */}
        <div className="relative overflow-hidden rounded-[calc(var(--radius-4xl)-1px)] bg-background/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-2xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-noise opacity-[0.035] mix-blend-overlay"
          />

          <div className="relative flex flex-col gap-6">
            <CardHeader className="items-center gap-3 pt-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] ring-1 ring-primary/20">
                <Pill className="size-8" aria-hidden />
              </div>
              {/* Guardia de contraste: título/labels usan foreground sólido, nunca opacidad reducida sobre el cristal. */}
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
                  Farmacia Juan de Dios
                </CardTitle>
                <CardDescription className="text-base text-foreground/60">
                  Ingresa tus credenciales para continuar
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <CardContent className="flex flex-col gap-4 px-8 sm:px-10">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="login"
                    className="text-sm font-medium text-foreground"
                  >
                    Usuario o correo electrónico
                  </Label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="login"
                      name="login"
                      autoComplete="username"
                      autoFocus
                      required
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl bg-background/90 pl-11 text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="password"
                      name="password"
                      type={verContrasena ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl bg-background/90 pr-11 pl-11 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      disabled={loading}
                      aria-label={
                        verContrasena
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {verContrasena ? (
                        <EyeOff className="size-4.5" aria-hidden />
                      ) : (
                        <Eye className="size-4.5" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="wrap-break-word rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </CardContent>

              <CardFooter className="flex-col gap-4 px-8 pb-10 sm:px-10">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-base font-semibold shadow-[0_10px_30px_-10px_var(--primary)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5 active:translate-y-0"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4.5 animate-spin" aria-hidden />
                      Ingresando…
                    </>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
                <p className="text-center text-xs text-balance text-muted-foreground">
                  El acceso está restringido al personal autorizado de la
                  farmacia.
                </p>
              </CardFooter>
            </form>
          </div>
        </div>
      </div>

      <p className="text-xs text-foreground/40">
        Sistema de Gestión Farmacéutica
      </p>
    </div>
  );
}
