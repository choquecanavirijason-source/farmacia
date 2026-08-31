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

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $supplierInti = Supplier::where('name', 'like', '%INTI%')->first() ?? Supplier::first();
        $supplierBago = Supplier::where('name', 'like', '%Bagó%')->first() ?? Supplier::first();
        $user = User::where('username', 'admin')->first() ?? User::first();
        $vendedora = User::where('username', 'paola.vargas')->first() ?? $user;
        $openCash = CashRegister::where('status', 'open')->first() ?? CashRegister::first();
        $efectivoMethod = PaymentMethod::where('name', 'Efectivo')->first() ?? PaymentMethod::first();
        $qrMethod = PaymentMethod::where('name', 'like', '%QR%')->first() ?? $efectivoMethod;

        $clients = Client::all();
        $medicaments = Medicament::with('batches')->get();

        if (! $supplierInti || ! $user || ! $openCash || $medicaments->isEmpty()) {
            return;
        }

        // 1. Registro de Compras Reales a Laboratorios
        $purchase1 = Purchase::firstOrCreate(
            ['invoice_number' => 'FAC-INTI-8921'],
            [
                'supplier_id' => $supplierInti->id,
                'purchase_date' => Carbon::now()->subDays(5)->toDateString(),
                'total' => 1250.00,
                'created_id' => $user->id,
            ]
        );

        $paracetamol = $medicaments->firstWhere('code', 'MED-001');
        if ($paracetamol && $paracetamol->batches->isNotEmpty()) {
            $pBatch = $paracetamol->batches->first();
            PurchaseDetail::firstOrCreate(
                ['purchase_id' => $purchase1->id, 'medicament_id' => $paracetamol->id],
                [
                    'batch_id' => $pBatch->id,
                    'quantity' => 200,
                    'unit_price' => 0.65,
                    'subtotal' => 130.00,
                ]
            );
        }

        $mentisan = $medicaments->firstWhere('code', 'MED-003');
        if ($mentisan && $mentisan->batches->isNotEmpty()) {
            $mBatch = $mentisan->batches->first();
            PurchaseDetail::firstOrCreate(
                ['purchase_id' => $purchase1->id, 'medicament_id' => $mentisan->id],
                [
                    'batch_id' => $mBatch->id,
                    'quantity' => 50,
                    'unit_price' => 7.80,
                    'subtotal' => 390.00,
                ]
            );
        }

        // 2. Registro de Ventas Reales del Día y de la Semana
        $salesData = [
            // Venta 1 (Hoy - Efectivo)
            [
                'client' => $clients->firstWhere('tax_id', '5283941'), // María Eugenia Flores
                'sold_at' => Carbon::today()->setTime(9, 15, 0),
                'method' => $efectivoMethod,
                'items' => [
                    ['code' => 'MED-004', 'qty' => 4], // Tapsin Día/Noche
                    ['code' => 'MED-015', 'qty' => 2], // Vitamina C 1000 mg
                ],
            ],
            // Venta 2 (Hoy - QR Simple)
            [
                'client' => $clients->firstWhere('tax_id', '7892134'), // Carlos Mamani
                'sold_at' => Carbon::today()->setTime(10, 45, 0),
                'method' => $qrMethod,
                'items' => [
                    ['code' => 'MED-003', 'qty' => 2], // Mentisan 25g
                    ['code' => 'MED-001', 'qty' => 10], // Paracetamol 500mg
                ],
            ],
            // Venta 3 (Hoy - Efectivo)
            [
                'client' => $clients->firstWhere('tax_id', '4920183'), // Rosa Claros
                'sold_at' => Carbon::today()->setTime(11, 30, 0),
                'method' => $efectivoMethod,
                'items' => [
                    ['code' => 'MED-007', 'qty' => 15], // Omeprazol 20mg
                    ['code' => 'MED-008', 'qty' => 6],  // Digestan Compuesto
                ],
            ],
            // Venta 4 (Hoy - QR Simple)
            [
                'client' => $clients->firstWhere('tax_id', '6719284'), // Juan Carlos Rodríguez
                'sold_at' => Carbon::today()->setTime(12, 10, 0),
                'method' => $qrMethod,
                'items' => [
                    ['code' => 'MED-016', 'qty' => 1], // Neurobión 25.000 Ampolla
                    ['code' => 'MED-017', 'qty' => 2], // Diclofenaco Inyectable
                ],
            ],
            // Venta 5 (Ayer)
            [
                'client' => $clients->firstWhere('tax_id', '1029384029'), // Clínica Los Olivos
                'sold_at' => Carbon::yesterday()->setTime(16, 20, 0),
                'method' => $qrMethod,
                'items' => [
                    ['code' => 'MED-005', 'qty' => 20], // Amoxicilina + Clavulánico
                    ['code' => 'MED-020', 'qty' => 10], // Alcohol en Gel 500 ml
                    ['code' => 'MED-018', 'qty' => 5],  // Povidona Yodada
                ],
            ],
        ];

        $invoiceCounter = 1001;
        foreach ($salesData as $sIndex => $s) {
            $client = $s['client'];
            $soldAt = $s['sold_at'];
            $method = $s['method'];

            // Calcular total de la venta
            $totalSale = 0;
            $itemsToCreate = [];
            foreach ($s['items'] as $itemRef) {
                $med = $medicaments->firstWhere('code', $itemRef['code']);
                if ($med && $med->batches->isNotEmpty()) {
                    $batch = $med->batches->first();
                    $subtotal = round($med->price * $itemRef['qty'], 2);
                    $totalSale += $subtotal;
                    $itemsToCreate[] = [
                        'medicament_id' => $med->id,
                        'batch_id' => $batch->id,
                        'quantity' => $itemRef['qty'],
                        'unit_price' => $med->price,
                        'discount_percent' => 0,
                        'subtotal' => $subtotal,
                    ];
                }
            }

            if ($totalSale > 0) {
                $invoiceCounter++;
                $sale = Sale::firstOrCreate(
                    [
                        'cash_register_id' => $openCash->id,
                        'user_id' => $vendedora->id,
                        'sold_at' => $soldAt,
                    ],
                    [
                        'client_id' => $client ? $client->id : null,
                        'total' => $totalSale,
                        'status' => 'active',
                        'created_id' => $vendedora->id,
                    ]
                );

                foreach ($itemsToCreate as $it) {
                    SaleDetail::firstOrCreate(
                        ['sale_id' => $sale->id, 'medicament_id' => $it['medicament_id'], 'batch_id' => $it['batch_id']],
                        $it
                    );

                    // Registro de movimiento en Kardex
                    InventoryMovement::firstOrCreate(
                        [
                            'batch_id' => $it['batch_id'],
                            'type' => 'out',
                            'occurred_at' => $soldAt,
                        ],
                        [
                            'quantity' => $it['quantity'],
                            'balance' => 80,
                            'reason' => "Venta comprobante #{$sale->id}",
                        ]
                    );
                }

                SalePayment::firstOrCreate(
                    ['sale_id' => $sale->id, 'payment_method_id' => $method->id],
                    ['amount' => $totalSale]
                );

                Invoice::firstOrCreate(
                    ['sale_id' => $sale->id],
                    [
                        'invoice_number' => "REC-00{$sale->id}",
                        'client_tax_id' => $client ? $client->tax_id : '0',
                        'business_name' => $client ? $client->name : 'Sin Nombre',
                        'issued_at' => $soldAt,
                        'total' => $totalSale,
                    ]
                );
            }
        }
    }
}
