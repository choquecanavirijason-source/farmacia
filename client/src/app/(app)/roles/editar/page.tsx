"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { fetchRole } from "@/lib/api/roles";
import type { IRole } from "@/lib/types/role";
import { RoleForm } from "../role-form";

function EditarRolContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const roleId = idParam ? Number(idParam) : null;

  const [role, setRole] = useState<IRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roleId || isNaN(roleId)) {
      setError("No se especificó un ID de rol válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchRole(roleId)
      .then((data) => {
        setRole(data);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "No se pudo cargar el rol.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [roleId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <Card className="max-w-md mx-auto mt-12 border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-lg">Error al cargar rol</h2>
            <p className="text-sm text-muted-foreground">{error || "El rol solicitado no existe o fue eliminado."}</p>
          </div>
          <Button nativeButton={false} render={<Link href="/roles" />} variant="outline" className="gap-2 mt-2">
            <ArrowLeft className="size-4" />
            Volver a Roles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <RoleForm role={role} />;
}

export default function EditarRolPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-44 w-full" />
        </div>
      }
    >
      <EditarRolContent />
    </Suspense>
  );
}
