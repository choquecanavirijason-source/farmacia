"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { CategorySection } from "./category-section";
import { PresentationSection } from "./presentation-section";
import { LaboratorySection } from "./laboratory-section";

type TabValue = "categorias" | "presentaciones" | "laboratorios";

const TITLES: Record<TabValue, { title: string; description: string }> = {
  categorias: {
    title: "Gestión de Categorías",
    description: "Catálogo de categorías terapéuticas para clasificar medicamentos.",
  },
  presentaciones: {
    title: "Gestión de Presentaciones",
    description: "Catálogo de presentaciones (tabletas, jarabe, ampolla, etc.) para medicamentos.",
  },
  laboratorios: {
    title: "Gestión de Laboratorios",
    description: "Catálogo de laboratorios fabricantes de medicamentos.",
  },
};

function CategoriasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = useAuth();

  const canCategorias = can(PERMISSIONS.VIEW_CATEGORIES);
  const canPresentaciones = can(PERMISSIONS.VIEW_PRESENTATIONS);
  const canLaboratorios = can(PERMISSIONS.VIEW_LABORATORIES);

  const requestedTab = (searchParams.get("tab") as TabValue) || "categorias";
  const isRequestedAllowed =
    (requestedTab === "categorias" && canCategorias) ||
    (requestedTab === "presentaciones" && canPresentaciones) ||
    (requestedTab === "laboratorios" && canLaboratorios);

  const fallbackTab: TabValue | null = canCategorias
    ? "categorias"
    : canPresentaciones
    ? "presentaciones"
    : canLaboratorios
    ? "laboratorios"
    : null;

  // Si el usuario no tiene permiso para la pestaña pedida (o pidió una que no existe),
  // redirige a la primera sección que sí puede ver.
  useEffect(() => {
    if (!isRequestedAllowed && fallbackTab && fallbackTab !== requestedTab) {
      router.replace(fallbackTab === "categorias" ? "/categorias" : `/categorias?tab=${fallbackTab}`);
    }
  }, [isRequestedAllowed, fallbackTab, requestedTab, router]);

  if (!fallbackTab) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver categorías, presentaciones ni laboratorios.
      </p>
    );
  }

  const activeTab = isRequestedAllowed ? requestedTab : fallbackTab;
  const { title, description } = TITLES[activeTab];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {activeTab === "categorias" && <CategorySection />}
      {activeTab === "presentaciones" && <PresentationSection />}
      {activeTab === "laboratorios" && <LaboratorySection />}
    </div>
  );
}

export default function CategoriasPage() {
  return (
    <Suspense fallback={null}>
      <CategoriasPageContent />
    </Suspense>
  );
}
