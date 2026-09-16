"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pill, Search, ShoppingCart, User, LogOut, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";

function initials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function MarketplaceHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]">
            <Pill className="size-5" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Farmacia Juan de Dios
          </span>
        </Link>

        <form onSubmit={handleSearch} className="order-3 flex w-full min-w-0 flex-1 items-center gap-2 sm:order-none">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar medicamentos, marcas..."
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemeToggle />

          <Button
            nativeButton={false}
            render={<Link href="/carrito" aria-label="Carrito" />}
            variant="ghost"
            size="icon"
            className="relative"
          >
            <ShoppingCart className="size-4.5" aria-hidden />
            {totalItems > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[10px]"
              >
                {totalItems}
              </Badge>
            )}
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
                <Avatar size="sm">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                  {user.firstname ?? user.name}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/mis-pedidos")}>
                  <PackageSearch className="size-4" aria-hidden />
                  Mis pedidos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="size-4" aria-hidden />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button nativeButton={false} render={<Link href="/login" />} variant="ghost">
                Iniciar sesión
              </Button>
              <Button nativeButton={false} render={<Link href="/registro" />}>
                <User className="size-4" aria-hidden />
                Crear cuenta
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
