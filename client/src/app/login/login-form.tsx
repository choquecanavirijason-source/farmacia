"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Pill, User, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
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
  const { login: authLogin } = useAuth();

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
      await authLogin(login, password);
      router.push(next);
      router.refresh();
    } catch (err: any) {
      const message =
        err?.response?.data?.errors?.login?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="relative w-full rounded-4xl bg-gradient-to-br from-primary/30 via-primary/10 to-transparent p-[2px] shadow-[0_35px_90px_-25px_rgba(15,23,42,0.5)] hover:shadow-[0_45px_100px_-30px_rgba(15,23,42,0.6)] transition-shadow duration-500">
        <div className="relative overflow-hidden rounded-[calc(var(--radius-4xl)-2px)] bg-gradient-to-b from-background/95 to-background/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-3xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"
          />

          <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <CardHeader className="items-center gap-4 pt-10 pb-2 text-center">
              <div className="flex items-center justify-center w-full">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/20 blur-xl" />
                  <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] ring-1 ring-primary/20">
                    <Pill className="size-9" aria-hidden />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-3xl font-bold tracking-tight text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent sm:text-4xl">
                  Farmacia Juan de Dios
                </CardTitle>
                <CardDescription className="text-sm text-foreground/60">
                  Ingresa tus credenciales para continuar
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <CardContent className="flex flex-col gap-5 px-8 sm:px-10">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="login"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Usuario o correo electrónico
                  </Label>
                  <div className="relative group">
                    <User
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
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
                      className="h-12 rounded-xl border-muted/40 bg-background/60 pl-11 text-base transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background/90"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground/80"
                    >
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
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
                      className="h-12 rounded-xl border-muted/40 bg-background/60 pr-11 pl-11 text-base transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background/90"
                      placeholder="••••••••"
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
                      className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="wrap-break-word animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive border border-destructive/20"
                  >
                    {error}
                  </p>
                ) : null}
              </CardContent>

              <CardFooter className="flex-col gap-5 px-8 pb-10 sm:px-10">
                <Button
                  type="submit"
                  className="relative h-12 w-full rounded-xl text-base font-semibold shadow-[0_10px_30px_-10px_var(--primary)] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-15px_var(--primary)] active:translate-y-0 active:scale-[0.98] overflow-hidden group"
                  disabled={loading}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {loading ? (
                    <>
                      <Loader2 className="size-4.5 animate-spin" aria-hidden />
                      Ingresando…
                    </>
                  ) : (
                    "Ingresar"
                  )}
                </Button>

                <div className="flex items-center gap-3 w-full">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-muted-foreground/20" />
                  <p className="text-center text-[11px] text-balance text-muted-foreground/60">
                    Acceso restringido al personal autorizado
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-muted-foreground/20" />
                </div>
              </CardFooter>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}