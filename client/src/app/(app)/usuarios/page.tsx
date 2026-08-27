"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type DataTableColumn,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/layout/confirm-delete-dialog";
import { deleteUsuario, fetchUsuarios, updateUsuario } from "@/lib/api/usuarios";
import { getClientSession } from "@/lib/auth/client-session";
import type { Sesion, Usuario } from "@/lib/types";
import { UsuarioFormDialog } from "@/app/(app)/usuarios/usuario-form-dialog";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  useEffect(() => {
    setSesion(getClientSession());
    fetchUsuarios().then(setUsuarios);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(usuario: Usuario) {
    setEditing(usuario);
    setFormOpen(true);
  }

  function upsertUsuario(saved: Usuario) {
    setUsuarios((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((u) => u.id_usuario === saved.id_usuario);
      return exists
        ? prev.map((u) => (u.id_usuario === saved.id_usuario ? saved : u))
        : [...prev, saved];
    });
  }

  function handleSaved(saved: Usuario) {
    const wasEditing = Boolean(editing);
    upsertUsuario(saved);
    toast.success(wasEditing ? "Usuario actualizado." : "Usuario creado.");
  }

  async function saveField(u: Usuario, field: "nombre" | "usuario", value: string) {
    const updated = await updateUsuario(
      u.id_usuario,
      { nombre: field === "nombre" ? value : u.nombre, usuario: field === "usuario" ? value : u.usuario, rol: u.rol, estado: u.estado },
      sesion?.id_usuario ?? null
    );
    upsertUsuario(updated);
  }

  const isLoading = usuarios === null;
  const hasAny = (usuarios?.length ?? 0) > 0;

  const columns: DataTableColumn<Usuario>[] = [
    {
      key: "nombre",
      header: "Nombre",
      accessor: (u) => u.nombre,
      className: "max-w-48",
      edit: { onSave: (u, value) => saveField(u, "nombre", String(value)) },
      render: (_, u) => (
        <span className="block truncate" title={u.nombre}>
          {u.nombre}
          {u.id_usuario === sesion?.id_usuario ? (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tú)</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "usuario",
      header: "Usuario",
      accessor: (u) => u.usuario,
      className: "max-w-32 truncate font-mono text-xs",
      edit: { onSave: (u, value) => saveField(u, "usuario", String(value)) },
    },
    {
      key: "rol",
      header: "Rol",
      accessor: (u) => u.rol,
      render: (_, u) => (
        <Badge variant={u.rol === "ADMINISTRADOR" ? "default" : "secondary"}>
          {u.rol === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (u) => u.estado,
      render: (_, u) => (
        <Badge variant={u.estado === "activo" ? "success" : "secondary"}>
          {u.estado === "activo" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "fecha_registro",
      header: "Registro",
      accessor: (u) => u.fecha_registro,
      className: "whitespace-nowrap text-muted-foreground",
    },
    {
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      accessor: () => null,
      sortable: false,
      filterable: false,
      className: "w-10",
      render: (_, u) => {
        const isSelf = u.id_usuario === sesion?.id_usuario;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${u.nombre}`} />}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openEdit(u)}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={() => setDeleteTarget(u)}>
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Cuentas de acceso al sistema y su rol (Administrador o Vendedor).
          </p>
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
      ) : (
        <DataTable
          data={usuarios ?? []}
          columns={columns}
          searchPlaceholder="Buscar por nombre o usuario…"
          emptyMessage="No se encontraron usuarios."
        />
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
