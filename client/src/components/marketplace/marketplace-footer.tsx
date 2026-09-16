import { Pill } from "lucide-react";

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Pill className="size-4" aria-hidden />
          Farmacia Juan de Dios
        </div>
        <p>Cochabamba, Bolivia · Av. Heroínas #456 esq. San Martín</p>
        <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
      </div>
    </footer>
  );
}
