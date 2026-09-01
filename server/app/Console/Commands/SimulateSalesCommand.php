<?php

namespace App\Console\Commands;

use App\Services\SimulationService;
use Illuminate\Console\Command;

class SimulateSalesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sales:simulate
                            {--start=2026-01-01 : Fecha de inicio (YYYY-MM-DD)}
                            {--end=2026-09-01 : Fecha de fin (YYYY-MM-DD)}
                            {--sellers=5 : Cantidad de vendedores}
                            {--supervisors=2 : Cantidad de supervisores}
                            {--admins=1 : Cantidad de administradores adicionales}
                            {--min=4 : Mínimo de ventas por día}
                            {--max=12 : Máximo de ventas por día}
                            {--no-reset : No reiniciar datos anteriores}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simula un historial realista de ventas y compras entre dos fechas para pruebas y reportes estadísticos';

    /**
     * Execute the console command.
     */
    public function handle(SimulationService $simulationService): int
    {
        $startDate = $this->option('start');
        $endDate = $this->option('end') ?: date('Y-m-d');
        $sellersCount = (int) $this->option('sellers');
        $supervisorsCount = (int) $this->option('supervisors');
        $adminsCount = (int) $this->option('admins');
        $minDaily = (int) $this->option('min');
        $maxDaily = (int) $this->option('max');
        $resetData = !$this->option('no-reset');

        $this->info("Iniciando simulación de ventas...");
        $this->line("Rango: <comment>{$startDate}</comment> al <comment>{$endDate}</comment>");
        $this->line("Ventas diarias: <comment>{$minDaily} - {$maxDaily}</comment>");
        $this->line("Personal: <comment>{$sellersCount}</comment> vendedores, <comment>{$supervisorsCount}</comment> supervisores, <comment>{$adminsCount}</comment> admins");

        $result = $simulationService->run([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'sellers_count' => $sellersCount,
            'supervisors_count' => $supervisorsCount,
            'admins_count' => $adminsCount,
            'min_daily_sales' => $minDaily,
            'max_daily_sales' => $maxDaily,
            'reset_data' => $resetData,
        ]);

        $this->info("¡Simulación completada con éxito!");
        $this->line("Ventas generadas: <info>{$result['summary']['total_sales']}</info>");
        $this->line("Compras generadas: <info>{$result['summary']['total_purchases']}</info>");
        $this->line("Total recaudado: <info>Bs. " . number_format($result['summary']['total_revenue'], 2) . "</info>");

        return Command::SUCCESS;
    }
}
