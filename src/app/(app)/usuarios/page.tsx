"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Search, SearchX, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteUsuario, fetchUsuarios } from "@/lib/api/usuarios";
import { getClientSession } from "@/lib/auth/client-session";
import type { Sesion, Usuario } from "@/lib/types";
import { UsuarioFormDialog } from "@/app/(app)/usuarios/usuario-form-dialog";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  useEffect(() => {
    setSesion(getClientSession());
    fetchUsuarios().then(setUsuarios);
  }, []);

  const filtered = useMemo(() => {
    if (!usuarios) return null;
    const query = search.trim().toLowerCase();
    if (!query) return usuarios;
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(query) || u.usuario.toLowerCase().includes(query)
    );
  }, [usuarios, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(usuario: Usuario) {
    setEditing(usuario);
    setFormOpen(true);
  }

  function handleSaved(saved: Usuario) {
    const wasEditing = Boolean(editing);
    setUsuarios((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((u) => u.id_usuario === saved.id_usuario);
      return exists
        ? prev.map((u) => (u.id_usuario === saved.id_usuario ? saved : u))
        : [...prev, saved];
    });
    toast.success(wasEditing ? "Usuario actualizado." : "Usuario creado.");
  }

  const isLoading = usuarios === null;
  const hasAny = (usuarios?.length ?? 0) > 0;
  const hasResults = (filtered?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas de acceso al sistema y su rol (Administrador o Vendedor).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o usuario…"
            className="pl-8"
            aria-label="Buscar usuarios"
          />
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0 gap-1.5">
          <Plus className="size-4" aria-hidden />
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !hasAny ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">Aún no hay usuarios registrados</p>
            <Button type="button" onClick={openCreate} className="mt-2 gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nuevo Usuario
            </Button>
          </CardContent>
        </Card>
      ) : !hasResults ? (
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">Sin resultados</p>
            <Button type="button" variant="outline" onClick={() => setSearch("")} className="mt-2">
              Limpiar búsqueda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((u) => {
                const isSelf = u.id_usuario === sesion?.id_usuario;
                return (
                  <TableRow key={u.id_usuario}>
                    <TableCell className="max-w-48 truncate font-medium" title={u.nombre}>
                      {u.nombre}
                      {isSelf ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tú)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-32 truncate font-mono text-xs" title={u.usuario}>
                      {u.usuario}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.rol === "ADMINISTRADOR" ? "default" : "secondary"}>
                        {u.rol === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.estado === "activo" ? "success" : "secondary"}>
                        {u.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {u.fecha_registro}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${u.nombre}`} />
                          }
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(u)}>
                            <Pencil className="size-4" aria-hidden />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isSelf}
                            onSelect={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <UsuarioFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        usuario={editing}
        currentUserId={sesion?.id_usuario ?? null}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar usuario?"
        description={
          <>
            Se eliminará la cuenta de <strong>{deleteTarget?.nombre}</strong>. Esta acción no se puede
            deshacer.
          </>
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteUsuario(deleteTarget.id_usuario, sesion?.id_usuario ?? null);
          setUsuarios((prev) =>
            prev ? prev.filter((u) => u.id_usuario !== deleteTarget.id_usuario) : prev
          );
          toast.success("Usuario eliminado.");
        }}
      />
    </div>
  );
}
