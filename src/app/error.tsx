"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MeshBackground } from "@/components/layout/mesh-background";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <MeshBackground />
      <Card className="w-full max-w-sm border-border/60 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold tracking-tight">Algo salió mal</p>
            <p className="max-w-xs text-sm text-balance text-muted-foreground">
              Ocurrió un error inesperado. Puedes intentar de nuevo.
            </p>
          </div>
          <Button type="button" onClick={reset}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
