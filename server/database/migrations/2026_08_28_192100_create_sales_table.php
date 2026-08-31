<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->timestamp('sold_at');
            $table->decimal('total', 10, 2);
            $table->enum('status', ['active', 'voided'])->default('active');
            $table->foreignId('client_id')->nullable()->constrained('clients');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('cash_register_id')->constrained('cash_registers');
            $table->unsignedBigInteger('created_id')->nullable();
            $table->unsignedBigInteger('updated_id')->nullable();
            $table->unsignedBigInteger('deleted_id')->nullable();
            $table->unsignedBigInteger('restored_id')->nullable();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
