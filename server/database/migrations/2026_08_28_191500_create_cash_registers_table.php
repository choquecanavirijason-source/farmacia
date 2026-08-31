<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->timestamp('opened_at');
            $table->decimal('opening_amount', 10, 2);
            $table->timestamp('closed_at')->nullable();
            $table->decimal('closing_amount', 10, 2)->nullable();
            $table->decimal('expected_closing_amount', 10, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
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
        Schema::dropIfExists('cash_registers');
    }
};
