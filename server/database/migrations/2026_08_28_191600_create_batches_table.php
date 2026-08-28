<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 60);
            $table->date('expiration_date');
            $table->unsignedInteger('current_quantity')->default(0);
            $table->decimal('purchase_price', 10, 2);
            $table->foreignId('medicament_id')->constrained('medicaments')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['medicament_id', 'batch_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
