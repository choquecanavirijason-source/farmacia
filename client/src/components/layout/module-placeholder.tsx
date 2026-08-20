import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Placeholder de un módulo aún no construido — deja el ruteo y el guard de rol verificables. */
export function ModulePlaceholder({ title, description, icon: Icon }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="text-sm text-muted-foreground text-balance">{description}</p>
      </div>

      <Card className="border-dashed border-border/60 bg-background/60">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Próximamente</p>
            <p className="max-w-sm text-xs text-muted-foreground text-balance">
              Este módulo se construirá en una próxima fase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
