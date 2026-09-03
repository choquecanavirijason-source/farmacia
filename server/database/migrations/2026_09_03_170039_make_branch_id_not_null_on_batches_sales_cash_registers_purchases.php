<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });
    }
};
