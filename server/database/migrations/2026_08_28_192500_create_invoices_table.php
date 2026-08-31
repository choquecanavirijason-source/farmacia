<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();
            $table->string('invoice_number', 30)->unique();
            $table->string('client_tax_id', 30);
            $table->string('business_name', 150);
            $table->dateTime('issued_at')->useCurrent();
            $table->decimal('total', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
