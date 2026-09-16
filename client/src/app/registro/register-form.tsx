"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, Pill, User } from "lucide-react";
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

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await register({
        firstname,
        lastname,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push("/");
      router.refresh();
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors) {
        const flat: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          flat[key] = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
        });
        setErrors(flat);
      } else {
        setErrors({ general: err?.response?.data?.message || "No se pudo crear la cuenta." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative w-full rounded-4xl bg-gradient-to-br from-primary/30 via-primary/10 to-transparent p-[2px] shadow-[0_35px_90px_-25px_rgba(15,23,42,0.5)]">
        <div className="relative overflow-hidden rounded-[calc(var(--radius-4xl)-2px)] bg-gradient-to-b from-background/95 to-background/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-3xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
          <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <CardHeader className="items-center gap-4 pt-10 pb-2 text-center">
              <div className="flex w-full items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/20 blur-xl" />
                  <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] ring-1 ring-primary/20">
                    <Pill className="size-9" aria-hidden />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Creá tu cuenta
                </CardTitle>
                <CardDescription className="text-sm text-foreground/60">
                  Para hacer pedidos y ver tu historial de compras
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <CardContent className="flex flex-col gap-4 px-8 sm:px-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstname">Nombre</Label>
                    <Input
                      id="firstname"
                      required
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-xl"
                    />
                    {errors.firstname && <span className="text-xs text-destructive">{errors.firstname}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastname">Apellido</Label>
                    <Input
                      id="lastname"
                      required
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-xl"
                    />
                    {errors.lastname && <span className="text-xs text-destructive">{errors.lastname}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-xl pl-11"
                    />
                  </div>
                  {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="password"
                      type={verContrasena ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-xl pr-11 pl-11"
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {verContrasena ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs text-destructive">{errors.password}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="password_confirmation"
                      type={verContrasena ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-xl pl-11"
                    />
                  </div>
                </div>

                {errors.general ? (
                  <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive border border-destructive/20">
                    {errors.general}
                  </p>
                ) : null}
              </CardContent>

              <CardFooter className="flex-col gap-5 px-8 pb-10 sm:px-10">
                <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4.5 animate-spin" aria-hidden />
                      Creando cuenta…
                    </>
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  ¿Ya tenés cuenta?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </CardFooter>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
