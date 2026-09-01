<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\Client;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\Medicament;
use App\Models\PaymentMethod;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\Simulation;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SimulationService
{
    public function isPrincipalAdmin(?User $user): bool
    {
        if (!$user) return false;
        return $user->id === 1 || $user->username === 'admin' || $user->email === 'admin@farmacia.bo';
    }

    public function getLatest(): ?Simulation
    {
        return Simulation::latest('id')->first();
    }

    public function run(array $params, ?User $currentUser = null): array
    {
        if ($currentUser && !$this->isPrincipalAdmin($currentUser)) {
            throw ValidationException::withMessages([
                'auth' => 'Acceso denegado. Solo el Administrador Principal puede ejecutar la simulación y reinicio de datos.',
            ]);
        }

        @ini_set('max_execution_time', '300');
        @set_time_limit(300);

        $startTimeGlobal = microtime(true);
        $timings = [];

        $startDateStr = $params['start_date'] ?? '2026-01-01';
        $endDateStr = $params['end_date'] ?? date('Y-m-d');
        $sellersCount = max(1, min(15, (int) ($params['sellers_count'] ?? 4)));
        $supervisorsCount = max(0, min(5, (int) ($params['supervisors_count'] ?? 2)));
        $adminsCount = max(0, min(5, (int) ($params['admins_count'] ?? 1)));
        $minDailySales = max(1, min(30, (int) ($params['min_daily_sales'] ?? 4)));
        $maxDailySales = max($minDailySales, min(50, (int) ($params['max_daily_sales'] ?? 10)));
        $resetData = filter_var($params['reset_data'] ?? true, FILTER_VALIDATE_BOOLEAN);

        $start = Carbon::parse($startDateStr)->startOfDay();
        $end = Carbon::parse($endDateStr)->endOfDay();
        $today = Carbon::today();

        if ($start->gt($end)) {
            $temp = $start;
            $start = $end->copy()->startOfDay();
            $end = $temp->copy()->endOfDay();
        }

        // FASE 1: Roles y Permisos
        $tRoles = microtime(true);
        (new RoleSeeder())->run();
        $timings['roles_permissions'] = round((microtime(true) - $tRoles) * 1000, 2) . ' ms';

        DB::beginTransaction();
        try {
            // Asegurar Admin Principal
            $principalAdmin = User::where('username', 'admin')
                ->orWhere('email', 'admin@farmacia.bo')
                ->orWhere('id', 1)
                ->first();

            if (!$principalAdmin) {
                $principalAdmin = User::create([
                    'name' => 'admin',
                    'username' => 'admin',
                    'email' => 'admin@farmacia.bo',
                    'firstname' => 'Juan de Dios',
                    'lastname' => 'Rocha Alcocer',
                    'password' => Hash::make('admin123'),
                    'state' => 'active',
                ]);
            }
            $principalAdmin->syncRoles(['administrator']);

            // FASE 2: Limpieza / Reseteo de Base de Datos
            $tCleanup = microtime(true);
            if ($resetData) {
                DB::table('sale_details')->delete();
                DB::table('sale_payments')->delete();
                DB::table('invoices')->delete();
                DB::table('sales')->delete();
                DB::table('inventory_movements')->delete();
                DB::table('purchase_details')->delete();
                DB::table('purchases')->delete();
                DB::table('cash_movements')->delete();
                DB::table('cash_registers')->delete();

                User::where('id', '!=', $principalAdmin->id)
                    ->where('username', '!=', 'admin')
                    ->where('email', '!=', 'admin@farmacia.bo')
                    ->forceDelete();

                DB::table('batches')->delete();
            }
            $timings['cleanup_reset'] = round((microtime(true) - $tCleanup) * 1000, 2) . ' ms';

            // FASE 3: Generación de Usuarios y Roles
            $tUsers = microtime(true);
            $generatedUsers = [];

            $generatedUsers[] = [
                'id' => $principalAdmin->id,
                'name' => 'Juan de Dios Rocha Alcocer',
                'username' => 'admin',
                'email' => 'admin@farmacia.bo',
                'role' => 'Administrador Principal',
                'password' => 'admin123',
                'is_primary' => true,
            ];

            $nombresVendedores = [
                ['Paola Andrea', 'Vargas Montaño', 'paola.vargas', 'vendedora@farmacia.bo', 'vendedor123'],
                ['Rodrigo', 'Claros Torrico', 'rodrigo.claros', 'cajero@farmacia.bo', 'caja123'],
                ['Ana Belén', 'Gutiérrez Flores', 'ana.gutierrez', 'ana.gutierrez@farmacia.bo', 'vendedor123'],
                ['Javier', 'López Balderrama', 'javier.lopez', 'javier.lopez@farmacia.bo', 'vendedor123'],
                ['Carla', 'Soliz Meneses', 'carla.soliz', 'carla.soliz@farmacia.bo', 'vendedor123'],
                ['Diego', 'Alvarez Castro', 'diego.alvarez', 'diego.alvarez@farmacia.bo', 'vendedor123'],
                ['Patricia', 'Morales Siles', 'patricia.morales', 'patricia.morales@farmacia.bo', 'vendedor123'],
                ['Gabriel', 'Rojas Guzman', 'gabriel.rojas', 'gabriel.rojas@farmacia.bo', 'vendedor123'],
            ];

            $nombresSupervisores = [
                ['Laura', 'Fernández Rios', 'laura.fernandez', 'laura.fernandez@farmacia.bo', 'supervisor123'],
                ['Marcelo', 'Quiroga Santa Cruz', 'marcelo.quiroga', 'marcelo.quiroga@farmacia.bo', 'supervisor123'],
                ['Elena', 'Torrez Paz', 'elena.torrez', 'elena.torrez@farmacia.bo', 'supervisor123'],
            ];

            $nombresAdmins = [
                ['Carlos', 'Mendoza Vaca', 'carlos.mendoza', 'carlos.mendoza@farmacia.bo', 'admin123'],
                ['Valeria', 'Camacho Ruiz', 'valeria.camacho', 'valeria.camacho@farmacia.bo', 'admin123'],
            ];

            $sellers = collect();
            for ($i = 0; $i < $sellersCount; $i++) {
                $info = $nombresVendedores[$i % count($nombresVendedores)];
                $suffix = $i >= count($nombresVendedores) ? ($i + 1) : '';
                $uname = $info[2] . $suffix;
                $mail = str_replace('@', "{$suffix}@", $info[3]);
                $pwd = $info[4];

                $u = User::updateOrCreate(
                    ['username' => $uname],
                    [
                        'name' => $uname,
                        'email' => $mail,
                        'firstname' => $info[0],
                        'lastname' => $info[1],
                        'password' => Hash::make($pwd),
                        'state' => 'active',
                    ]
                );
                $u->syncRoles(['seller']);
                $sellers->push($u);

                $generatedUsers[] = [
                    'id' => $u->id,
                    'name' => "{$info[0]} {$info[1]}",
                    'username' => $uname,
                    'email' => $mail,
                    'role' => 'Vendedor',
                    'password' => $pwd,
                    'is_primary' => false,
                ];
            }

            $supervisors = collect();
            for ($i = 0; $i < $supervisorsCount; $i++) {
                $info = $nombresSupervisores[$i % count($nombresSupervisores)];
                $suffix = $i >= count($nombresSupervisores) ? ($i + 1) : '';
                $uname = $info[2] . $suffix;
                $mail = str_replace('@', "{$suffix}@", $info[3]);
                $pwd = $info[4];

                $u = User::updateOrCreate(
                    ['username' => $uname],
                    [
                        'name' => $uname,
                        'email' => $mail,
                        'firstname' => $info[0],
                        'lastname' => $info[1],
                        'password' => Hash::make($pwd),
                        'state' => 'active',
                    ]
                );
                $u->syncRoles(['supervisor']);
                $supervisors->push($u);

                $generatedUsers[] = [
                    'id' => $u->id,
                    'name' => "{$info[0]} {$info[1]}",
                    'username' => $uname,
                    'email' => $mail,
                    'role' => 'Supervisor',
                    'password' => $pwd,
                    'is_primary' => false,
                ];
            }

            $extraAdmins = collect([$principalAdmin]);
            for ($i = 0; $i < $adminsCount; $i++) {
                $info = $nombresAdmins[$i % count($nombresAdmins)];
                $suffix = $i >= count($nombresAdmins) ? ($i + 1) : '';
                $uname = $info[2] . $suffix;
                $mail = str_replace('@', "{$suffix}@", $info[3]);
                $pwd = $info[4];

                $u = User::updateOrCreate(
                    ['username' => $uname],
                    [
                        'name' => $uname,
                        'email' => $mail,
                        'firstname' => $info[0],
                        'lastname' => $info[1],
                        'password' => Hash::make($pwd),
                        'state' => 'active',
                    ]
                );
                $u->syncRoles(['administrator']);
                $extraAdmins->push($u);

                $generatedUsers[] = [
                    'id' => $u->id,
                    'name' => "{$info[0]} {$info[1]}",
                    'username' => $uname,
                    'email' => $mail,
                    'role' => 'Administrador',
                    'password' => $pwd,
                    'is_primary' => false,
                ];
            }

            $allStaff = $sellers->concat($supervisors)->concat($extraAdmins);
            $timings['user_generation'] = round((microtime(true) - $tUsers) * 1000, 2) . ' ms';

            // FASE 4: Inicialización de Lotes y Medicamentos
            $tBatches = microtime(true);
            $medicaments = Medicament::all();
            if ($medicaments->isEmpty()) {
                throw new \Exception('No hay medicamentos registrados en la base de datos.');
            }

            $batchRowsToInsert = [];
            $nowStr = Carbon::now()->toDateTimeString();

            foreach ($medicaments as $index => $med) {
                $hasBatch = Batch::where('medicament_id', $med->id)->exists();
                if (!$hasBatch) {
                    // Distribución realista para reportes:
                    if ($index < 3) {
                        // Stock bajo / crítico
                        $expDate = Carbon::now()->addMonths(rand(12, 24))->toDateString();
                        $qty = rand(2, 4); // Menor que min_stock (10-20)
                    } elseif ($index < 6) {
                        // Próximo a vencer dentro de 15 a 45 días
                        $expDate = Carbon::now()->addDays(rand(12, 45))->toDateString();
                        $qty = rand(40, 120);
                    } elseif ($index < 8) {
                        // Próximo a vencer dentro de 60 a 85 días
                        $expDate = Carbon::now()->addDays(rand(60, 85))->toDateString();
                        $qty = rand(50, 150);
                    } elseif ($index === 8) {
                        // Lote ya vencido recientemente
                        $expDate = Carbon::now()->subDays(rand(5, 20))->toDateString();
                        $qty = rand(10, 30);
                    } else {
                        // Stock normal y fecha lejana
                        $expDate = Carbon::now()->addMonths(rand(10, 28))->toDateString();
                        $qty = rand(250, 600);
                    }

                    $batchRowsToInsert[] = [
                        'medicament_id' => $med->id,
                        'batch_number' => 'LOT-' . strtoupper(substr(md5($med->id . '-init'), 0, 6)),
                        'expiration_date' => $expDate,
                        'current_quantity' => $qty,
                        'purchase_price' => round($med->price * 0.60, 2),
                        'created_at' => $nowStr,
                        'updated_at' => $nowStr,
                    ];
                }
            }

            if (!empty($batchRowsToInsert)) {
                DB::table('batches')->insert($batchRowsToInsert);
            }

            $medicaments = Medicament::with('batches')->get();
            $clients = Client::all();
            $suppliers = Supplier::all();
            $paymentMethods = PaymentMethod::all();
            $efectivoMethod = $paymentMethods->firstWhere('name', 'Efectivo') ?? $paymentMethods->first();
            $qrMethod = $paymentMethods->firstWhere('name', 'like', '%QR%') ?? $efectivoMethod;
            $tarjetaMethod = $paymentMethods->firstWhere('name', 'like', '%Tarjeta%') ?? $efectivoMethod;

            $timings['batches_init'] = round((microtime(true) - $tBatches) * 1000, 2) . ' ms';

            // FASE 5: Simulación de Compras, Ventas, Cajas y Facturas
            $tSimulation = microtime(true);

            $currentDate = $start->copy();
            $totalSalesCreated = 0;
            $totalPurchasesCreated = 0;
            $totalRevenueGenerated = 0;
            $dayCounter = 0;

            $salesToInsert = [];
            $saleDetailsToInsert = [];
            $salePaymentsToInsert = [];
            $invoicesToInsert = [];
            $inventoryMovementsToInsert = [];
            $cashRegistersToInsert = [];
            $purchasesToInsert = [];
            $purchaseDetailsToInsert = [];

            $saleIdCounter = 1;
            $purchaseIdCounter = 1;
            $cashRegisterIdCounter = 1;

            while ($currentDate->lte($end)) {
                $dayCounter++;
                $isToday = $currentDate->isSameDay($today);
                $isWeekend = $currentDate->isWeekend();

                // Reposición periódica de inventario
                if ($dayCounter % 15 === 0 && $suppliers->isNotEmpty()) {
                    $supplier = $suppliers->random();
                    $purchaseTotal = 0;
                    $purchaseDateStr = $currentDate->format('Y-m-d H:i:s');
                    $invoiceNum = 'FAC-' . strtoupper(substr($supplier->name, 0, 3)) . '-' . (1000 + $dayCounter);
                    $currentPurchaseId = $purchaseIdCounter++;

                    $selectedMeds = $medicaments->random(min(5, $medicaments->count()));
                    foreach ($selectedMeds as $med) {
                        $cost = round($med->price * 0.60, 2);
                        $qty = rand(80, 250);
                        $sub = round($cost * $qty, 2);
                        $purchaseTotal += $sub;

                        $batch = $med->batches->first();
                        if ($batch) {
                            $purchaseDetailsToInsert[] = [
                                'purchase_id' => $currentPurchaseId,
                                'medicament_id' => $med->id,
                                'batch_id' => $batch->id,
                                'quantity' => $qty,
                                'unit_price' => $cost,
                                'subtotal' => $sub,
                                'created_at' => $nowStr,
                                'updated_at' => $nowStr,
                            ];

                            $inventoryMovementsToInsert[] = [
                                'batch_id' => $batch->id,
                                'type' => 'in',
                                'quantity' => $qty,
                                'balance' => $batch->current_quantity + $qty,
                                'reason' => "Compra de reposición {$invoiceNum}",
                                'occurred_at' => $currentDate->copy()->setTime(8, 15, 0)->toDateTimeString(),
                                'created_at' => $nowStr,
                                'updated_at' => $nowStr,
                            ];
                        }
                    }

                    $purchasesToInsert[] = [
                        'id' => $currentPurchaseId,
                        'supplier_id' => $supplier->id,
                        'invoice_number' => $invoiceNum,
                        'purchase_date' => $purchaseDateStr,
                        'total' => $purchaseTotal,
                        'created_id' => $extraAdmins->random()->id ?? $principalAdmin->id,
                        'created_at' => $nowStr,
                        'updated_at' => $nowStr,
                    ];

                    $totalPurchasesCreated++;
                }

                // Caja de la jornada (esquema: id, opened_at, closed_at, opening_amount, closing_amount, expected_closing_amount, status, created_id, created_at, updated_at)
                $cashier = $sellers->random() ?? $allStaff->random();
                $openedAt = $currentDate->copy()->setTime(8, 0, 0)->toDateTimeString();
                $closedAt = $isToday ? null : $currentDate->copy()->setTime(21, 30, 0)->toDateTimeString();
                $openingAmount = 200.00;
                $currentCashRegisterId = $cashRegisterIdCounter++;

                $dailyCount = rand($minDailySales, $maxDailySales);
                if ($isWeekend) {
                    $dailyCount += rand(2, 5);
                }

                $dailyCashTotal = 0;

                for ($s = 0; $s < $dailyCount; $s++) {
                    $hour = rand(8, 20);
                    $minute = rand(0, 59);
                    $second = rand(0, 59);
                    $saleTime = $currentDate->copy()->setTime($hour, $minute, $second)->toDateTimeString();

                    $seller = $sellers->random() ?? $allStaff->random();
                    $hasClient = (rand(1, 10) <= 7) && $clients->isNotEmpty();
                    $client = $hasClient ? $clients->random() : null;

                    $pmRoll = rand(1, 100);
                    if ($pmRoll <= 60) {
                        $paymentMethod = $efectivoMethod;
                    } elseif ($pmRoll <= 85) {
                        $paymentMethod = $qrMethod;
                    } else {
                        $paymentMethod = $tarjetaMethod;
                    }

                    $isVoided = rand(1, 100) <= 3;
                    $status = $isVoided ? 'voided' : 'active';
                    $currentSaleId = $saleIdCounter++;

                    $itemsCount = rand(1, 4);
                    $selectedMeds = $medicaments->random(min($itemsCount, $medicaments->count()));

                    $saleTotal = 0;

                    foreach ($selectedMeds as $med) {
                        $batch = $med->batches->first();
                        if (!$batch) continue;

                        $qty = rand(1, 4);
                        $unitPrice = (float) $med->price;
                        $subtotal = round($unitPrice * $qty, 2);
                        $saleTotal += $subtotal;

                        $saleDetailsToInsert[] = [
                            'sale_id' => $currentSaleId,
                            'medicament_id' => $med->id,
                            'batch_id' => $batch->id,
                            'quantity' => $qty,
                            'unit_price' => $unitPrice,
                            'discount_percent' => 0,
                            'subtotal' => $subtotal,
                            'created_at' => $nowStr,
                            'updated_at' => $nowStr,
                        ];

                        if (!$isVoided) {
                            $inventoryMovementsToInsert[] = [
                                'batch_id' => $batch->id,
                                'type' => 'out',
                                'quantity' => $qty,
                                'balance' => max(0, 500 - $qty),
                                'reason' => "Venta comprobante #{$currentSaleId}",
                                'occurred_at' => $saleTime,
                                'created_at' => $nowStr,
                                'updated_at' => $nowStr,
                            ];
                        }
                    }

                    if ($saleTotal <= 0) continue;

                    // sales schema: id, sold_at, total, status, client_id, user_id, cash_register_id, created_id, created_at, updated_at
                    $salesToInsert[] = [
                        'id' => $currentSaleId,
                        'cash_register_id' => $currentCashRegisterId,
                        'user_id' => $seller->id,
                        'client_id' => $client?->id,
                        'sold_at' => $saleTime,
                        'total' => $saleTotal,
                        'status' => $status,
                        'created_id' => $seller->id,
                        'created_at' => $nowStr,
                        'updated_at' => $nowStr,
                    ];

                    if ($paymentMethod) {
                        $salePaymentsToInsert[] = [
                            'sale_id' => $currentSaleId,
                            'payment_method_id' => $paymentMethod->id,
                            'amount' => $saleTotal,
                            'created_at' => $nowStr,
                            'updated_at' => $nowStr,
                        ];

                        if (!$isVoided && $paymentMethod->name === 'Efectivo') {
                            $dailyCashTotal += $saleTotal;
                        }
                    }

                    $clientName = $client ? trim(($client->firstname ?? '') . ' ' . ($client->lastname ?? '')) : 'Sin Nombre';
                    if (empty($clientName)) $clientName = 'Sin Nombre';
                    $clientTaxId = $client ? ($client->nit ?: $client->ci ?: '0') : '0';

                    $invoicesToInsert[] = [
                        'sale_id' => $currentSaleId,
                        'invoice_number' => 'REC-' . str_pad((string) $currentSaleId, 6, '0', STR_PAD_LEFT),
                        'client_tax_id' => $clientTaxId,
                        'business_name' => $clientName,
                        'issued_at' => $saleTime,
                        'total' => $saleTotal,
                        'created_at' => $nowStr,
                        'updated_at' => $nowStr,
                    ];

                    if (!$isVoided) {
                        $totalRevenueGenerated += $saleTotal;
                    }
                    $totalSalesCreated++;
                }

                $finalCash = round($openingAmount + $dailyCashTotal, 2);
                $cashRegistersToInsert[] = [
                    'id' => $currentCashRegisterId,
                    'opened_at' => $openedAt,
                    'closed_at' => $closedAt,
                    'opening_amount' => $openingAmount,
                    'closing_amount' => $isToday ? null : $finalCash,
                    'expected_closing_amount' => $finalCash,
                    'status' => $isToday ? 'open' : 'closed',
                    'created_id' => $cashier->id,
                    'created_at' => $nowStr,
                    'updated_at' => $nowStr,
                ];

                $currentDate->addDay();
            }

            // FASE 6: Inserción masiva en chunks optimizados
            $tDbInsert = microtime(true);

            if (!empty($purchasesToInsert)) {
                foreach (array_chunk($purchasesToInsert, 200) as $chunk) {
                    DB::table('purchases')->insert($chunk);
                }
            }

            if (!empty($purchaseDetailsToInsert)) {
                foreach (array_chunk($purchaseDetailsToInsert, 500) as $chunk) {
                    DB::table('purchase_details')->insert($chunk);
                }
            }

            if (!empty($cashRegistersToInsert)) {
                foreach (array_chunk($cashRegistersToInsert, 200) as $chunk) {
                    DB::table('cash_registers')->insert($chunk);
                }
            }

            if (!empty($salesToInsert)) {
                foreach (array_chunk($salesToInsert, 500) as $chunk) {
                    DB::table('sales')->insert($chunk);
                }
            }

            if (!empty($saleDetailsToInsert)) {
                foreach (array_chunk($saleDetailsToInsert, 1000) as $chunk) {
                    DB::table('sale_details')->insert($chunk);
                }
            }

            if (!empty($salePaymentsToInsert)) {
                foreach (array_chunk($salePaymentsToInsert, 1000) as $chunk) {
                    DB::table('sale_payments')->insert($chunk);
                }
            }

            if (!empty($invoicesToInsert)) {
                foreach (array_chunk($invoicesToInsert, 1000) as $chunk) {
                    DB::table('invoices')->insert($chunk);
                }
            }

            if (!empty($inventoryMovementsToInsert)) {
                foreach (array_chunk($inventoryMovementsToInsert, 1000) as $chunk) {
                    DB::table('inventory_movements')->insert($chunk);
                }
            }

            // Sincronizar secuencias de IDs en PostgreSQL
            DB::statement("SELECT setval(pg_get_serial_sequence('sales', 'id'), coalesce(max(id), 1)) FROM sales");
            DB::statement("SELECT setval(pg_get_serial_sequence('purchases', 'id'), coalesce(max(id), 1)) FROM purchases");
            DB::statement("SELECT setval(pg_get_serial_sequence('cash_registers', 'id'), coalesce(max(id), 1)) FROM cash_registers");

            $timings['simulation_processing'] = round((microtime(true) - $tSimulation) * 1000, 2) . ' ms';
            $timings['bulk_db_inserts'] = round((microtime(true) - $tDbInsert) * 1000, 2) . ' ms';

            $totalSeconds = round(microtime(true) - $startTimeGlobal, 3);
            $timings['total_execution_time'] = $totalSeconds . ' s';

            $summary = [
                'total_sales' => $totalSalesCreated,
                'total_purchases' => $totalPurchasesCreated,
                'total_revenue' => round($totalRevenueGenerated, 2),
                'sellers_count' => $sellers->count(),
                'supervisors_count' => $supervisors->count(),
                'admins_count' => $extraAdmins->count(),
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end->format('Y-m-d'),
                'timings' => $timings,
            ];

            // Guardar registro en la tabla de simulaciones
            $sim = Simulation::create([
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end->format('Y-m-d'),
                'status' => 'completed',
                'attributes' => [
                    'summary' => $summary,
                    'generated_users' => $generatedUsers,
                    'timings' => $timings,
                    'params' => [
                        'start_date' => $start->format('Y-m-d'),
                        'end_date' => $end->format('Y-m-d'),
                        'sellers_count' => $sellersCount,
                        'supervisors_count' => $supervisorsCount,
                        'admins_count' => $adminsCount,
                        'min_daily_sales' => $minDailySales,
                        'max_daily_sales' => $maxDailySales,
                        'reset_data' => $resetData,
                    ],
                ],
            ]);

            DB::commit();

            return [
                'id' => $sim->id,
                'summary' => $summary,
                'generated_users' => $generatedUsers,
                'timings' => $timings,
                'created_at' => $sim->created_at?->toISOString(),
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
