import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { menuItemsForRole } from "@/lib/nav/menu-config";
import { ICON_MAP } from "@/lib/nav/menu-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const sesion = await getSession();
  const items = sesion ? menuItemsForRole(sesion.rol) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Bienvenido, {sesion?.nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          Menú principal — accede a los módulos disponibles para tu rol.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          return (
            <Link key={item.href} href={item.href} className="group focus-visible:outline-none">
              <Card className="h-full border-border/60 transition-colors duration-300 ease-in-out group-hover:border-primary/40 group-hover:bg-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <CardTitle className="text-sm font-medium leading-snug text-balance">
                      {item.label}
                    </CardTitle>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Ir al módulo</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
