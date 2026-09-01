<?php

namespace Database\Seeders;

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
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalesSimulationSeeder extends Seeder
{
    protected string $startDate = '2026-01-01';
    protected string $endDate = '2026-09-01';
    protected int $minDailySales = 4;
    protected int $maxDailySales = 12;

    public function setConfig(string $startDate, string $endDate, int $minDailySales = 4, int $maxDailySales = 12): self
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->minDailySales = $minDailySales;
        $this->maxDailySales = $maxDailySales;
        return $this;
    }

    public function run(): void
    {
        // Asegurar que existan roles y usuarios
        $this->call([RoleSeeder::class, UserSeeder::class]);

        $sellers = User::role('seller')->get();
        $supervisors = User::role('supervisor')->get();
        $admins = User::role('administrator')->get();
        $allStaff = $sellers->concat($supervisors)->concat($admins);

        if ($allStaff->isEmpty()) {
            $this->command?->warn('No se encontraron usuarios para la simulación.');
            return;
        }

        $clients = Client::all();
        $medicaments = Medicament::with(['batches' => function ($q) {
            $q->whereNull('deleted_at');
        }])->get();

        if ($medicaments->isEmpty()) {
            $this->command?->warn('No hay medicamentos registrados.');
            return;
        }

        $paymentMethods = PaymentMethod::all();
        $efectivoMethod = $paymentMethods->firstWhere('name', 'Efectivo') ?? $paymentMethods->first();
        $qrMethod = $paymentMethods->firstWhere('name', 'QR Simple') ?? $efectivoMethod;
        $tarjetaMethod = $paymentMethods->firstWhere('name', 'Tarjeta de Débito') ?? $efectivoMethod;

        $suppliers = Supplier::all();

        $start = Carbon::parse($this->startDate)->startOfDay();
        $end = Carbon::parse($this->endDate)->endOfDay();
        $today = Carbon::today();

        $this->command?->info("Iniciando simulación de ventas desde {$start->format('Y-m-d')} hasta {$end->format('Y-m-d')}...");

        // Iterar día por día
        $currentDate = $start->copy();
        $totalSalesCreated = 0;
        $totalPurchasesCreated = 0;

        DB::beginTransaction();
        try {
            $dayCounter = 0;

            while ($currentDate->lte($end)) {
                $dayCounter++;
                $isToday = $currentDate->isSameDay($today);
                $isWeekend = $currentDate->isWeekend();

                // 1. Periódicamente (cada 15-20 días), registrar una compra de reposición a proveedores
                if ($dayCounter % 18 === 0 && $suppliers->isNotEmpty()) {
                    $supplier = $suppliers->random();
                    $purchaseTotal = 0;
                    $purchaseDateStr = $currentDate->format('Y-m-d');
                    $invoiceNum = 'FAC-' . strtoupper(substr($supplier->name, 0, 3)) . '-' . (1000 + $dayCounter);

                    $purchase = Purchase::firstOrCreate(
                        ['invoice_number' => $invoiceNum],
                        [
                            'supplier_id' => $supplier->id,
                            'purchase_date' => $purchaseDateStr,
                            'total' => 0,
                            'created_id' => $admins->random()->id ?? $allStaff->random()->id,
                        ]
                    );

                    $selectedMeds = $medicaments->random(min(4, $medicaments->count()));
                    foreach ($selectedMeds as $med) {
                        $cost = round($med->price * 0.60, 2);
                        $qty = rand(50, 200);
                        $sub = round($cost * $qty, 2);
                        $purchaseTotal += $sub;

                        $batch = $med->batches->first();
                        if (!$batch) {
                            $batch = Batch::create([
                                'medicament_id' => $med->id,
                                'batch_number' => 'LOT-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                                'expiration_date' => $currentDate->copy()->addMonths(rand(12, 24))->toDateString(),
                                'initial_quantity' => $qty,
                                'current_quantity' => $qty,
                                'purchase_price' => $cost,
                                'status' => 'active',
                            ]);
                        } else {
                            $batch->increment('current_quantity', $qty);
                        }

                        PurchaseDetail::firstOrCreate(
                            ['purchase_id' => $purchase->id, 'medicament_id' => $med->id],
                            [
                                'batch_id' => $batch->id,
                                'quantity' => $qty,
                                'unit_price' => $cost,
                                'subtotal' => $sub,
                            ]
                        );

                        InventoryMovement::create([
                            'batch_id' => $batch->id,
                            'type' => 'in',
                            'quantity' => $qty,
                            'balance' => $batch->current_quantity,
                            'reason' => "Compra de reposición {$purchase->invoice_number}",
                            'occurred_at' => $currentDate->copy()->setTime(8, 15, 0),
                        ]);
                    }

                    $purchase->update(['total' => $purchaseTotal]);
                    $totalPurchasesCreated++;
                }

                // 2. Crear una caja para la jornada
                $cashier = $sellers->random() ?? $allStaff->random();
                $openedAt = $currentDate->copy()->setTime(8, 0, 0);
                $closedAt = $isToday ? null : $currentDate->copy()->setTime(21, 30, 0);
                $openingAmount = 200.00;

                $cashRegister = CashRegister::create([
                    'user_id' => $cashier->id,
                    'opened_at' => $openedAt,
                    'closed_at' => $closedAt,
                    'opening_amount' => $openingAmount,
                    'closing_amount' => $openingAmount, // Se actualizará al final del día
                    'expected_closing_amount' => $openingAmount,
                    'status' => $isToday ? 'open' : 'closed',
                    'notes' => "Caja turno jornada " . $currentDate->format('d/m/Y'),
                ]);

                // 3. Cantidad de ventas en el día (mayor en fines de semana)
                $dailyCount = rand($this->minDailySales, $this->maxDailySales);
                if ($isWeekend) {
                    $dailyCount += rand(2, 5);
                }

                $dailyCashTotal = 0;

                for ($s = 0; $s < $dailyCount; $s++) {
                    // Hora distribuida a lo largo de la jornada (08:30 a 21:00)
                    $hour = rand(8, 20);
                    $minute = rand(0, 59);
                    $second = rand(0, 59);
                    $saleTime = $currentDate->copy()->setTime($hour, $minute, $second);

                    // Vendedor
                    $seller = $sellers->random() ?? $allStaff->random();

                    // Cliente (70% asignado a cliente, 30% Cliente General)
                    $hasClient = (rand(1, 10) <= 7) && $clients->isNotEmpty();
                    $client = $hasClient ? $clients->random() : null;

                    // Método de pago
                    $pmRoll = rand(1, 100);
                    if ($pmRoll <= 60) {
                        $paymentMethod = $efectivoMethod;
                    } elseif ($pmRoll <= 85) {
                        $paymentMethod = $qrMethod;
                    } else {
                        $paymentMethod = $tarjetaMethod;
                    }

                    // 97% activas, 3% anuladas
                    $isVoided = rand(1, 100) <= 3;
                    $status = $isVoided ? 'voided' : 'active';

                    // Seleccionar entre 1 y 4 productos
                    $itemsCount = rand(1, 4);
                    $selectedMeds = $medicaments->random(min($itemsCount, $medicaments->count()));

                    $saleTotal = 0;
                    $saleItemsData = [];

                    foreach ($selectedMeds as $med) {
                        $batch = $med->batches->first();
                        if (!$batch) {
                            // Crear un lote si no existe
                            $batch = Batch::create([
                                'medicament_id' => $med->id,
                                'batch_number' => 'LOT-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                                'expiration_date' => $currentDate->copy()->addMonths(rand(10, 24))->toDateString(),
                                'initial_quantity' => 200,
                                'current_quantity' => 180,
                                'purchase_price' => round($med->price * 0.6, 2),
                                'status' => 'active',
                            ]);
                        }

                        $qty = rand(1, 5);
                        $unitPrice = (float) $med->price;
                        $subtotal = round($unitPrice * $qty, 2);
                        $saleTotal += $subtotal;

                        $saleItemsData[] = [
                            'medicament_id' => $med->id,
                            'batch_id' => $batch->id,
                            'quantity' => $qty,
                            'unit_price' => $unitPrice,
                            'discount_percent' => 0,
                            'subtotal' => $subtotal,
                        ];
                    }

                    if ($saleTotal <= 0) continue;

                    // Crear Venta
                    $sale = Sale::create([
                        'cash_register_id' => $cashRegister->id,
                        'user_id' => $seller->id,
                        'client_id' => $client?->id,
                        'sold_at' => $saleTime,
                        'total' => $saleTotal,
                        'status' => $status,
                        'created_id' => $seller->id,
                        'voided_at' => $isVoided ? $saleTime->copy()->addMinutes(rand(5, 30)) : null,
                        'voided_by' => $isVoided ? ($supervisors->random()->id ?? $admins->random()->id) : null,
                        'void_reason' => $isVoided ? 'Error en digitación de medicamentos solicitado por el cliente' : null,
                    ]);

                    // Detalles de Venta
                    foreach ($saleItemsData as $item) {
                        SaleDetail::create([
                            'sale_id' => $sale->id,
                            'medicament_id' => $item['medicament_id'],
                            'batch_id' => $item['batch_id'],
                            'quantity' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'discount_percent' => $item['discount_percent'],
                            'subtotal' => $item['subtotal'],
                        ]);

                        if (!$isVoided) {
                            // Descontar stock
                            Batch::where('id', $item['batch_id'])->decrement('current_quantity', $item['quantity']);

                            // Kardex
                            InventoryMovement::create([
                                'batch_id' => $item['batch_id'],
                                'type' => 'out',
                                'quantity' => $item['quantity'],
                                'balance' => max(0, 100 - $item['quantity']),
                                'reason' => "Venta comprobante #{$sale->id}",
                                'occurred_at' => $saleTime,
                            ]);
                        }
                    }

                    // Pago de la Venta
                    if ($paymentMethod) {
                        SalePayment::create([
                            'sale_id' => $sale->id,
                            'payment_method_id' => $paymentMethod->id,
                            'amount' => $saleTotal,
                        ]);

                        if (!$isVoided && $paymentMethod->name === 'Efectivo') {
                            $dailyCashTotal += $saleTotal;
                        }
                    }

                    // Factura / Comprobante
                    $clientName = $client ? trim(($client->firstname ?? '') . ' ' . ($client->lastname ?? '')) : 'Sin Nombre';
                    if (empty($clientName)) $clientName = 'Sin Nombre';
                    $clientTaxId = $client ? ($client->nit ?: $client->ci ?: '0') : '0';

                    Invoice::create([
                        'sale_id' => $sale->id,
                        'invoice_number' => 'REC-' . str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
                        'client_tax_id' => $clientTaxId,
                        'business_name' => $clientName,
                        'issued_at' => $saleTime,
                        'total' => $saleTotal,
                    ]);

                    $totalSalesCreated++;
                }

                // Actualizar arqueo de caja con el efectivo recaudado
                $finalCash = round($openingAmount + $dailyCashTotal, 2);
                $cashRegister->update([
                    'expected_closing_amount' => $finalCash,
                    'closing_amount' => $isToday ? null : $finalCash,
                ]);

                // Avanzar al siguiente día
                $currentDate->addDay();
            }

            DB::commit();
            $this->command?->info("Simulación completada con éxito: {$totalSalesCreated} ventas y {$totalPurchasesCreated} compras registradas.");
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command?->error("Error en la simulación: " . $e->getMessage());
            throw $e;
        }
    }
}
