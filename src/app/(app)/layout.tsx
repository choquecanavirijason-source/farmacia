import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MENU_GROUPS } from "@/lib/nav/menu-config";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();
  if (!sesion) {
    redirect("/login");
  }

  const groups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(sesion.rol)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <Sidebar groups={groups} />
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <Topbar sesion={sesion} groups={groups} />
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
