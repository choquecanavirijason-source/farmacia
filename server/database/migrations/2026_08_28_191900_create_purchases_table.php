<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 60);
            $table->date('purchase_date');
            $table->decimal('total', 12, 2)->default(0);
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['supplier_id', 'invoice_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
