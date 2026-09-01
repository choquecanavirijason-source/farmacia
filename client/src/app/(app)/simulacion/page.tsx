"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  FlaskConical,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Timer,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import {
  fetchLatestSimulation,
  runSimulation,
  type GeneratedUser,
  type SimulationParams,
  type SimulationRecord,
} from "@/lib/api/simulation";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export default function SimulacionPage() {
  const { user } = useAuth();

  // Control de acceso: solo Administrador Principal
  const isRootAdmin =
    user?.id === 1 || user?.username === "admin" || user?.email === "admin@farmacia.bo";

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [sellersCount, setSellersCount] = useState<number>(5);
  const [supervisorsCount, setSupervisorsCount] = useState<number>(2);
  const [adminsCount, setAdminsCount] = useState<number>(1);
  const [minDailySales, setMinDailySales] = useState<number>(4);
  const [maxDailySales, setMaxDailySales] = useState<number>(12);
  const [resetData, setResetData] = useState<boolean>(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingLatest, setFetchingLatest] = useState(true);
  const [latestSim, setLatestSim] = useState<SimulationRecord | null>(null);

  // Estados para seguimiento detallado en vivo del progreso (1% - 100%) y tiempo transcurrido
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressDescription, setProgressDescription] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  // Cargar estado de la última simulación realizada
  useEffect(() => {
    if (!isRootAdmin) return;
    setFetchingLatest(true);
    fetchLatestSimulation()
      .then((sim) => {
        if (sim) {
          setLatestSim(sim);
          if (sim.params) {
            if (sim.params.start_date) setStartDate(sim.params.start_date);
            if (sim.params.end_date) setEndDate(sim.params.end_date);
            if (sim.params.sellers_count) setSellersCount(sim.params.sellers_count);
            if (sim.params.supervisors_count) setSupervisorsCount(sim.params.supervisors_count);
            if (sim.params.admins_count) setAdminsCount(sim.params.admins_count);
            if (sim.params.min_daily_sales) setMinDailySales(sim.params.min_daily_sales);
            if (sim.params.max_daily_sales) setMaxDailySales(sim.params.max_daily_sales);
          }
        }
      })
      .catch(() => {})
      .finally(() => setFetchingLatest(false));
  }, [isRootAdmin]);

  if (!isRootAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="size-8" />
        </div>
        <div className="max-w-md flex flex-col gap-2">
          <h1 className="text-xl font-bold">Acceso Restringido</h1>
          <p className="text-sm text-muted-foreground">
            El módulo de Simulación y Reinicio de Datos de Prueba está reservado exclusivamente para el{" "}
            <strong>Administrador Principal</strong> del sistema.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Volver al Panel Principal
        </Button>
      </div>
    );
  }

  function getStageDescription(p: number): string {
    if (p < 15) return "Iniciando: Verificando permisos y preparando entorno seguro...";
    if (p < 30) return "Fase 1: Limpiando transacciones previas y reseteando tablas...";
    if (p < 50) return "Fase 2: Creando vendedores, supervisores y administradores...";
    if (p < 70) return "Fase 3: Abasteciendo inventario y configurando lotes iniciales...";
    if (p < 88) return "Fase 4: Simulando ventas diarias, facturas y arqueos de caja...";
    if (p < 99) return "Fase 5: Ejecutando inserciones masivas en BD y sincronizando Kardex...";
    return "¡Completado! Consolidando métricas y guardando resultados.";
  }

  async function handleExecute() {
    setConfirmOpen(false);
    setLoading(true);
    setProgressPercent(1);
    setProgressDescription(getStageDescription(1));
    setElapsedSeconds(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);

    // Animación suave del porcentaje de progreso
    let currentP = 1;
    progressIntervalRef.current = setInterval(() => {
      if (currentP < 95) {
        // Incremento gradual y dinámico
        const step = currentP < 30 ? 2 : currentP < 70 ? 3 : currentP < 90 ? 2 : 1;
        currentP = Math.min(95, currentP + step);
        setProgressPercent(currentP);
        setProgressDescription(getStageDescription(currentP));
      }
    }, 60);

    try {
      const params: SimulationParams = {
        start_date: startDate,
        end_date: endDate,
        sellers_count: Number(sellersCount),
        supervisors_count: Number(supervisorsCount),
        admins_count: Number(adminsCount),
        min_daily_sales: Number(minDailySales),
        max_daily_sales: Number(maxDailySales),
        reset_data: resetData,
      };

      const res = await runSimulation(params);

      // Finalización inmediata al 100%
      setProgressPercent(100);
      setProgressDescription("¡Simulación completada con éxito!");

      setLatestSim({
        id: res.id,
        start_date: startDate,
        end_date: endDate,
        status: "completed",
        summary: res.summary,
        generated_users: res.generated_users,
        timings: res.timings || res.summary?.timings,
        params,
        created_at: res.created_at,
      });

      toast.success("¡Simulación completada con éxito!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Ocurrió un error o tiempo de espera al ejecutar la simulación."
      );
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }

  function copyCredentials(u: GeneratedUser) {
    const text = `Usuario: ${u.username}\nContraseña: ${u.password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    toast.success(`Credenciales de ${u.name} copiadas al portapapeles.`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const timings = latestSim?.timings || latestSim?.summary?.timings;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Simulador de Datos de Prueba</h1>
            <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 text-primary">
              <Shield className="size-3" /> Solo Admin Principal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Genera un historial realista de ventas, compras, arqueos de caja y personal para probar reportes estadísticos.
          </p>
        </div>

        {latestSim?.summary && (
          <Button variant="outline" size="sm" nativeButton={false} className="gap-2 text-xs w-fit" render={<Link href="/reportes" />}>
            <BarChart3 className="size-4" /> Ir a Reportes Estadísticos <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Alerta informativa sobre el reseteo seguro */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs">
        <Database className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-primary">Reinicio Seguro y Parametrizado</span>
          <span className="text-muted-foreground leading-relaxed">
            Al activar el reinicio, se limpian las transacciones anteriores (ventas, compras, movimientos de caja) y se regeneran los lotes con stock limpio.{" "}
            <strong>Tu usuario administrador principal, roles, permisos y catálogos base quedan 100% protegidos y preservados.</strong>
          </span>
        </div>
      </div>

      {/* MONITOR DE EJECUCIÓN EN VIVO CON PORCENTAJE (1% - 100%) */}
      {loading && (
        <Card className="border-primary/50 bg-primary/5 shadow-lg animate-in fade-in duration-300">
          <CardContent className="py-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="size-6 text-primary animate-spin" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-foreground">
                    Ejecutando Simulación ({progressPercent}%)
                  </span>
                  <span className="text-xs text-primary font-medium">
                    {progressDescription}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold bg-background/90 px-3 py-1.5 rounded-md border shadow-xs">
                <Timer className="size-4 text-primary" />
                <span>{elapsedSeconds.toFixed(1)}s</span>
              </div>
            </div>

            {/* Barra de progreso interactiva con indicador visual */}
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-full rounded-full bg-muted/80 p-0.5 overflow-hidden border">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-100 ease-out shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>0% Inicio</span>
                <span className="font-bold text-primary">{progressPercent}%</span>
                <span>100% Fin</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULTADOS Y USUARIOS ACTIVOS (Si ya se ejecutó una simulación) */}
      {latestSim && !loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border/70 shadow-sm bg-card">
              <CardContent className="pt-4 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Periodo Simulado</span>
                <span className="text-sm font-bold font-mono">
                  {formatDate(latestSim.start_date)} — {formatDate(latestSim.end_date)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Ejecutado: {formatDateTime(latestSim.created_at)}
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm bg-card">
              <CardContent className="pt-4 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Total Ventas Registradas</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {latestSim.summary?.total_sales ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground">Comprobantes y Kardex generados</span>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm bg-card">
              <CardContent className="pt-4 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Recaudación Total</span>
                <span className="text-xl font-bold font-mono text-primary">
                  {formatCurrency(latestSim.summary?.total_revenue ?? 0)}
                </span>
                <span className="text-[10px] text-muted-foreground">Arqueos de caja balanceados</span>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm bg-card">
              <CardContent className="pt-4 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Personal de Farmacia</span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {latestSim.summary?.sellers_count ?? 0} Vendedores, {latestSim.summary?.supervisors_count ?? 0} Sup.
                </span>
                <span className="text-[10px] text-muted-foreground">Listos para iniciar sesión</span>
              </CardContent>
            </Card>
          </div>

          {/* DESGLOSE DE TIEMPOS DE RENDIMIENTO */}
          {timings && (
            <Card className="border-border/70 bg-muted/10 shadow-sm">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Activity className="size-3.5 text-primary" /> Rendimiento y Tiempos de Ejecución
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-[11px] gap-1 bg-background">
                    <Zap className="size-3 text-amber-500" /> Tiempo Total:{" "}
                    <strong>{timings.total_execution_time ?? "—"}</strong>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-background border flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Roles / Permisos</span>
                    <strong className="font-mono text-xs">{timings.roles_permissions ?? "—"}</strong>
                  </div>
                  <div className="p-2 rounded bg-background border flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Limpieza Tablas</span>
                    <strong className="font-mono text-xs">{timings.cleanup_reset ?? "—"}</strong>
                  </div>
                  <div className="p-2 rounded bg-background border flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Generar Usuarios</span>
                    <strong className="font-mono text-xs">{timings.user_generation ?? "—"}</strong>
                  </div>
                  <div className="p-2 rounded bg-background border flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Lotes / Stock</span>
                    <strong className="font-mono text-xs">{timings.batches_init ?? "—"}</strong>
                  </div>
                  <div className="p-2 rounded bg-background border flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Cálculo Jornadas</span>
                    <strong className="font-mono text-xs">{timings.simulation_processing ?? "—"}</strong>
                  </div>
                  <div className="p-2 rounded bg-background border flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Inserción BD</span>
                    <strong className="font-mono text-xs text-primary">{timings.bulk_db_inserts ?? "—"}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TABLA DE USUARIOS DE PRUEBA ACTIVOS */}
          {latestSim.generated_users && latestSim.generated_users.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="size-4 text-primary" /> Usuarios de Prueba Disponibles
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Credenciales activas para acceder y probar el sistema con distintos roles (Vendedor, Supervisor, Administrador).
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={latestSim.generated_users}
                  columns={[
                    {
                      key: "name",
                      header: "Nombre y Apellidos",
                      accessor: (u) => u.name,
                      className: "font-medium text-xs",
                      render: (_, u) => {
                        const isCurrent = user?.username === u.username;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                              {u.name.charAt(0)}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{u.name}</span>
                              {isCurrent && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/50 text-primary">
                                  Tú
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      key: "username",
                      header: "Usuario",
                      accessor: (u) => u.username,
                      className: "w-36 font-mono text-xs font-semibold text-foreground",
                    },
                    {
                      key: "role",
                      header: "Rol Asignado",
                      accessor: (u) => u.role,
                      className: "w-36 text-xs",
                      render: (_, u) => (
                        <Badge
                          variant={
                            u.role.includes("Admin")
                              ? "default"
                              : u.role.includes("Supervisor")
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px] font-normal"
                        >
                          {u.role}
                        </Badge>
                      ),
                    },
                    {
                      key: "password",
                      header: "Contraseña",
                      accessor: (u) => u.password,
                      className: "w-32 font-mono text-xs text-muted-foreground",
                      render: (_, u) => (
                        <span className="bg-muted px-2 py-0.5 rounded text-[11px] border">
                          {u.password}
                        </span>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Acción",
                      accessor: (u) => u.id,
                      className: "w-28 text-right",
                      render: (_, u) => {
                        const isCopied = copiedId === u.id;
                        return (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => copyCredentials(u)}
                            className="gap-1 text-[11px]"
                            title="Copiar usuario y contraseña"
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3 text-success" /> Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" /> Copiar
                              </>
                            )}
                          </Button>
                        );
                      },
                    },
                  ]}
                  searchPlaceholder="Buscar usuario por nombre, usuario o rol..."
                  emptyMessage="No se encontraron usuarios de prueba."
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* FORMULARIO DE CONFIGURACIÓN Y EJECUCIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-sm border-border/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="size-4 text-primary" /> Parámetros para la Nueva Simulación
            </CardTitle>
            <CardDescription className="text-xs">
              Configura las fechas y el volumen para regenerar los datos de prueba.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 text-xs">
            {/* Rango de Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-muted/20 border">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" /> Fecha de Inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" /> Fecha de Fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Configuración de Usuarios / Personal */}
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" /> Personal a Generar / Asignar
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="sellersCount" className="text-[11px] text-muted-foreground">
                    Vendedores / Cajeros
                  </Label>
                  <Input
                    id="sellersCount"
                    type="number"
                    min={1}
                    max={15}
                    value={sellersCount}
                    onChange={(e) => setSellersCount(Math.max(1, Number(e.target.value)))}
                    className="h-8 font-mono text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Rol: Vendedor</span>
                </div>

                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="supervisorsCount" className="text-[11px] text-muted-foreground">
                    Supervisores
                  </Label>
                  <Input
                    id="supervisorsCount"
                    type="number"
                    min={0}
                    max={5}
                    value={supervisorsCount}
                    onChange={(e) => setSupervisorsCount(Math.max(0, Number(e.target.value)))}
                    className="h-8 font-mono text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Rol: Supervisor</span>
                </div>

                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="adminsCount" className="text-[11px] text-muted-foreground">
                    Admins Adicionales
                  </Label>
                  <Input
                    id="adminsCount"
                    type="number"
                    min={0}
                    max={5}
                    value={adminsCount}
                    onChange={(e) => setAdminsCount(Math.max(0, Number(e.target.value)))}
                    className="h-8 font-mono text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">+ Admin Principal</span>
                </div>
              </div>
            </div>

            {/* Rango de Ventas Diarias */}
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> Volumen de Ventas por Jornada
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="minDaily" className="text-[11px] text-muted-foreground">
                    Ventas Mínimas / Día
                  </Label>
                  <Input
                    id="minDaily"
                    type="number"
                    min={1}
                    max={30}
                    value={minDailySales}
                    onChange={(e) => setMinDailySales(Math.max(1, Number(e.target.value)))}
                    className="h-8 font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="maxDaily" className="text-[11px] text-muted-foreground">
                    Ventas Máximas / Día
                  </Label>
                  <Input
                    id="maxDaily"
                    type="number"
                    min={minDailySales}
                    max={50}
                    value={maxDailySales}
                    onChange={(e) => setMaxDailySales(Math.max(minDailySales, Number(e.target.value)))}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Opción de Reset */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300">
              <input
                id="resetData"
                type="checkbox"
                checked={resetData}
                onChange={(e) => setResetData(e.target.checked)}
                className="size-4 rounded border-amber-500 text-primary focus:ring-primary"
              />
              <Label htmlFor="resetData" className="text-xs cursor-pointer select-none">
                <strong>Reiniciar datos transaccionales anteriores</strong> (Limpia ventas, compras y arqueos previos para generar un escenario limpio y coherente).
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t pt-4">
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="gap-2 text-xs font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Simulando ({progressPercent}%)...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Ejecutar Simulación
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Panel Lateral: Información y Atajos */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2">
                <KeyRound className="size-3.5" /> Accesos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground">
              <p>
                Al ejecutar la simulación, se guardarán los resultados y la lista de usuarios en la base de datos para que puedas consultarlos o iniciar sesión con cualquiera de ellos en cualquier momento.
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Contraseña Vendedores:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono">vendedor123</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contraseña Supervisores:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono">supervisor123</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contraseña Administradores:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono">admin123</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de Confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5 text-amber-500" /> Confirmar Simulación de Datos
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 text-muted-foreground leading-relaxed">
              {resetData ? (
                <>
                  Se eliminarán las ventas, compras y arqueos de caja anteriores para generar un nuevo conjunto de datos desde el{" "}
                  <strong>{startDate}</strong> hasta el <strong>{endDate}</strong>.
                  <br />
                  <br />
                  Tu usuario administrador principal y los roles del sistema se mantendrán intactos.
                </>
              ) : (
                <>
                  Se generarán ventas y compras adicionales desde el <strong>{startDate}</strong> hasta el{" "}
                  <strong>{endDate}</strong> sin eliminar los registros previos.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleExecute} className="gap-1.5 font-semibold">
              <CheckCircle2 className="size-4" /> Confirmar y Ejecutar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
