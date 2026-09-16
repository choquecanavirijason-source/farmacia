"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InputTextField, TextAreaField } from "@/components/form";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { createOrder } from "@/lib/api/marketplace";
import { setFormErrorsFromServer } from "@/lib/utils/form-errors";
import type { IOrder } from "@/lib/types/marketplace";

const checkoutSchema = z.object({
  contact_name: z.string().trim().min(1, "El nombre es obligatorio").max(255, "Máximo 255 caracteres"),
  contact_phone: z.string().trim().min(1, "El teléfono es obligatorio").max(20, "Máximo 20 caracteres"),
  notes: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || undefined),
});

type CheckoutFormData = z.input<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<IOrder | null>(null);

  const methods = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      contact_name: user?.name ?? "",
      contact_phone: "",
      notes: "",
    },
  });

  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.name) {
      methods.setValue("contact_name", user.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name]);

  async function onSubmit(data: CheckoutFormData) {
    setServerError(null);
    try {
      const response = await createOrder({
        contact_name: data.contact_name.trim(),
        contact_phone: data.contact_phone.trim(),
        notes: data.notes ? data.notes.trim() : undefined,
        items: items.map((item) => ({ medicament_id: item.medicament_id, quantity: item.quantity })),
      });
      clearCart();
      setConfirmedOrder(response.data);
    } catch (err: any) {
      const hasFieldErrors = setFormErrorsFromServer(err, setError, setFocus);
      const message = err?.response?.data?.message;
      if (!hasFieldErrors && message) {
        setServerError(message);
      } else if (err?.response?.data?.errors?.items) {
        setServerError(err.response.data.errors.items[0]);
      }
      if (!message) {
        toast.error("No se pudo crear el pedido. Intenta de nuevo.");
      }
    }
  }

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (confirmedOrder) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <CheckCircle2 className="size-12 text-success" aria-hidden />
        <h1 className="text-xl font-semibold text-foreground">¡Pedido realizado!</h1>
        <p className="text-muted-foreground">
          Tu pedido <span className="font-semibold text-foreground">{confirmedOrder.order_number}</span> fue
          registrado. Te vamos a contactar al {confirmedOrder.contact_phone} para coordinar la entrega o
          recojo, y el pago se realiza en ese momento.
        </p>
        <div className="mt-4 flex gap-3">
          <Button nativeButton={false} render={<Link href="/mis-pedidos" />}>
            Ver mis pedidos
          </Button>
          <Button nativeButton={false} render={<Link href="/" />} variant="outline">
            Seguir comprando
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <Pill className="size-10 text-muted-foreground/50" aria-hidden />
        <h1 className="text-lg font-semibold text-foreground">No tenés productos en el carrito</h1>
        <Button nativeButton={false} render={<Link href="/" />} className="mt-2">
          Ir al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/carrito"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al carrito
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Confirmar pedido</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold text-foreground">Datos de contacto</h2>

            {serverError && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{serverError}</span>
              </div>
            )}

            <InputTextField name="contact_name" label="Nombre de quien recoge / recibe" required />
            <InputTextField name="contact_phone" label="Teléfono de contacto" required />
            <TextAreaField
              name="notes"
              label="Notas (opcional)"
              placeholder="Ej. horario preferido, referencia de entrega..."
              rows={3}
            />

            <Button type="submit" disabled={isSubmitting} className="mt-2 gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Confirmar pedido
            </Button>
          </form>
        </FormProvider>

        <div className="h-fit rounded-3xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Resumen</h2>
          <Separator className="my-3" />
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.medicament_id} className="flex justify-between gap-2 text-muted-foreground">
                <span className="truncate">
                  {item.quantity} x {item.name}
                </span>
                <span className="shrink-0 text-foreground">Bs {(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>Bs {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
