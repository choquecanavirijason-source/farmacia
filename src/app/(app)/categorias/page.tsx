"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriaSection } from "@/app/(app)/categorias/categoria-section";
import { PresentacionSection } from "@/app/(app)/categorias/presentacion-section";
import { LaboratorioSection } from "@/app/(app)/categorias/laboratorio-section";

export default function CategoriasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Catálogos de referencia para Medicamentos: categorías, presentaciones y laboratorios.
        </p>
      </div>

      <Tabs defaultValue="categorias">
        <TabsList>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="presentaciones">Presentaciones</TabsTrigger>
          <TabsTrigger value="laboratorios">Laboratorios</TabsTrigger>
        </TabsList>
        <TabsContent value="categorias">
          <CategoriaSection />
        </TabsContent>
        <TabsContent value="presentaciones">
          <PresentacionSection />
        </TabsContent>
        <TabsContent value="laboratorios">
          <LaboratorioSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
