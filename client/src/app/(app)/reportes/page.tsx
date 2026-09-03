"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchBatches, diasHasta } from "@/lib/api/batches";
import { fetchMedicaments } from "@/lib/api/medicaments";
import { fetchSalesSummary, type ISalesSummary } from "@/lib/api/dashboard";
import { SalesSection } from "./sales-section";
import { TopProductsSection } from "./top-products-section";
import { LowStockSection } from "./low-stock-section";
import { ExpiringBatchesSection } from "./expiring-batches-section";
import { KardexSection } from "./kardex-section";
import type { StockBajoItem } from "./types";

function getSevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getThirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [stats, setStats] = useState<ISalesSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [medicamentos, setMedicamentos] = useState<any[] | null>(null);
  const [lotes, setLotes] = useState<any[] | null>(null);

  const [tempPreset, setTempPreset] = useState<string>("7dias");
  const [tempStartDate, setTempStartDate] = useState<string>(getSevenDaysAgo());
  const [tempEndDate, setTempEndDate] = useState<string>(getToday());

  const [appliedStartDate, setAppliedStartDate] = useState<string>(getSevenDaysAgo());
  const [appliedEndDate, setAppliedEndDate] = useState<string>(getToday());

  const [idMedicamentoKardex, setIdMedicamentoKardex] = useState("");

  function loadCatalogs() {
    setLoadingCatalogs(true);
    Promise.all([
      fetchMedicaments(true).catch(() => []),
      fetchBatches(true).catch(() => []),
    ])
      .then(([meds, lots]) => {
        setMedicamentos(meds);
        setLotes(lots);
        if (meds.length > 0 && !idMedicamentoKardex) {
          setIdMedicamentoKardex(String(meds[0].id));
        }
      })
      .finally(() => setLoadingCatalogs(false));
  }

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingStats(true);

    fetchSalesSummary(
      {
        start_date: appliedStartDate || undefined,
        end_date: appliedEndDate || undefined,
      },
      controller.signal
    )
      .then((st) => {
        setStats(st);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStats(false);
      });

    return () => controller.abort();
  }, [appliedStartDate, appliedEndDate]);

  function handlePresetChange(val: string | null) {
    if (!val) return;
    setTempPreset(val);
    if (val === "hoy") {
      const today = getToday();
      setTempStartDate(today);
      setTempEndDate(today);
    } else if (val === "7dias") {
      setTempStartDate(getSevenDaysAgo());
      setTempEndDate(getToday());
    } else if (val === "30dias") {
      setTempStartDate(getThirtyDaysAgo());
      setTempEndDate(getToday());
    } else if (val === "mes") {
      setTempStartDate(getMonthStart());
      setTempEndDate(getToday());
    }
  }

  function handleApplyFilters() {
    setAppliedStartDate(tempStartDate);
    setAppliedEndDate(tempEndDate);
  }

  const stockAnalisis = useMemo<StockBajoItem[] | null>(() => {
    if (!medicamentos) return null;

    const stockMap = new Map<number, number>();
    if (lotes && lotes.length > 0) {
      for (const l of lotes) {
        const mId = l.medicament_id || l.id_medicamento;
        const currentQty = Number(l.current_quantity ?? l.cantidad_actual ?? 0);
        stockMap.set(mId, (stockMap.get(mId) ?? 0) + currentQty);
      }
    }

    return medicamentos.map((m: any) => {
      const mId = m.id || m.id_medicamento;
      const stock = stockMap.has(mId)
        ? (stockMap.get(mId) ?? 0)
        : Number(m.total_stock ?? m.stock_actual ?? 0);

      const minStock = Number(m.min_stock ?? m.stock_minimo ?? 0);
      const deficit = Math.max(0, minStock - stock);

      let status: "agotado" | "critico" | "bajo" | "optimo" = "optimo";
      if (stock === 0) {
        status = "agotado";
      } else if (stock <= Math.floor(minStock / 2)) {
        status = "critico";
      } else if (stock < minStock) {
        status = "bajo";
      }

      return {
        medicamento: m,
        stock,
        minStock,
        deficit,
        status,
      };
    });
  }, [medicamentos, lotes]);

  const medicamentoById = useMemo(
    () => new Map((medicamentos ?? []).map((m) => [m.id || m.id_medicamento, m])),
    [medicamentos]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Reportes Estadísticos</h1>
          <p className="text-sm text-muted-foreground">
            Apoyo a la toma de decisiones: análisis de ventas, rotación de productos, inventario, vencimientos y kardex.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadCatalogs}
          disabled={loadingCatalogs}
          className="gap-1.5 text-xs w-fit"
        >
          <RefreshCw className={`size-3.5 ${loadingCatalogs ? "animate-spin" : ""}`} />
          Recargar Datos
        </Button>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ventas">Tendencia de Ventas</TabsTrigger>
          <TabsTrigger value="mas-vendidos">
            Más Vendidos (Top)
            {stats?.top_productos && stats.top_productos.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {stats.top_productos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock-bajo">
            Estado de Inventario / Stock
            {stockAnalisis && stockAnalisis.filter((i) => i.deficit > 0).length > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {stockAnalisis.filter((i) => i.deficit > 0).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="por-vencer">
            Próximos a Vencer
            {lotes && lotes.filter((l) => diasHasta(l.expiration_date || l.fecha_vencimiento) <= 90).length > 0 && (
              <Badge variant="warning" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {lotes.filter((l) => diasHasta(l.expiration_date || l.fecha_vencimiento) <= 90).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kardex">Kardex por Medicamento</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          <SalesSection
            stats={stats}
            loadingStats={loadingStats}
            startDate={tempStartDate}
            endDate={tempEndDate}
            preset={tempPreset}
            appliedStartDate={appliedStartDate}
            appliedEndDate={appliedEndDate}
            onPresetChange={handlePresetChange}
            onStartDateChange={setTempStartDate}
            onEndDateChange={setTempEndDate}
            onApplyFilters={handleApplyFilters}
          />
        </TabsContent>

        <TabsContent value="mas-vendidos">
          <TopProductsSection
            stats={stats}
            loadingStats={loadingStats}
            startDate={tempStartDate}
            endDate={tempEndDate}
            preset={tempPreset}
            appliedStartDate={appliedStartDate}
            appliedEndDate={appliedEndDate}
            onPresetChange={handlePresetChange}
            onStartDateChange={setTempStartDate}
            onEndDateChange={setTempEndDate}
            onApplyFilters={handleApplyFilters}
          />
        </TabsContent>

        <TabsContent value="stock-bajo">
          <LowStockSection
            stockAnalisis={stockAnalisis}
            loadingCatalogs={loadingCatalogs}
          />
        </TabsContent>

        <TabsContent value="por-vencer">
          <ExpiringBatchesSection
            lotes={lotes}
            loadingCatalogs={loadingCatalogs}
            medicamentoById={medicamentoById}
          />
        </TabsContent>

        <TabsContent value="kardex">
          <KardexSection
            medicamentos={medicamentos}
            selectedMedicamentId={idMedicamentoKardex}
            onSelectMedicament={setIdMedicamentoKardex}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
