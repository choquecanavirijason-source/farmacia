<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\CashRegister;
use App\Models\InventoryAdjustment;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $supplier = Supplier::first();
        $batch = Batch::first();
        $user = User::first();
        $cashRegister = CashRegister::where('status', 'open')->first();
        $paymentMethod = PaymentMethod::first();

        if (! $supplier || ! $batch || ! $user || ! $cashRegister || ! $paymentMethod) {
            return;
        }

        $purchase = Purchase::firstOrCreate(
            ['invoice_number' => 'PURCHASE-001', 'supplier_id' => $supplier->id],
            ['purchase_date' => now()->toDateString(), 'total' => 300],
        );
        PurchaseDetail::firstOrCreate(
            ['purchase_id' => $purchase->id, 'medicament_id' => $batch->medicament_id, 'batch_id' => $batch->id],
            ['quantity' => 100, 'unit_price' => 3, 'subtotal' => 300],
        );

        $sale = Sale::firstOrCreate(
            ['cash_register_id' => $cashRegister->id, 'user_id' => $user->id, 'sold_at' => now()],
            ['total' => 5, 'status' => 'active', 'client_id' => null],
        );
        SaleDetail::firstOrCreate(
            ['sale_id' => $sale->id, 'medicament_id' => $batch->medicament_id, 'batch_id' => $batch->id],
            ['quantity' => 1, 'unit_price' => 5, 'discount_percent' => 0, 'subtotal' => 5],
        );
        SalePayment::firstOrCreate(
            ['sale_id' => $sale->id, 'payment_method_id' => $paymentMethod->id],
            ['amount' => 5],
        );
        Invoice::firstOrCreate(
            ['invoice_number' => 'INV-001'],
            ['sale_id' => $sale->id, 'client_tax_id' => '0000000', 'business_name' => 'Final Consumer', 'issued_at' => now(), 'total' => 5],
        );
        InventoryMovement::firstOrCreate(
            ['batch_id' => $batch->id, 'type' => 'in', 'reason' => 'Initial stock'],
            ['quantity' => 100, 'balance' => $batch->current_quantity, 'occurred_at' => now()],
        );
        InventoryAdjustment::firstOrCreate(
            ['batch_id' => $batch->id, 'user_id' => $user->id, 'reason' => 'other'],
            ['quantity' => 0, 'occurred_at' => now()],
        );
    }
}
