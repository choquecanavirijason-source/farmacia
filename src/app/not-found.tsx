import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MeshBackground } from "@/components/layout/mesh-background";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <MeshBackground />
      <Card className="w-full max-w-sm border-border/60 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold tracking-tight">Página no encontrada</p>
            <p className="max-w-xs text-sm text-balance text-muted-foreground">
              La página que buscas no existe o fue movida.
            </p>
          </div>
          <Button render={<Link href="/dashboard" />}>Ir al menú principal</Button>
        </CardContent>
      </Card>
    </div>
  );
}
