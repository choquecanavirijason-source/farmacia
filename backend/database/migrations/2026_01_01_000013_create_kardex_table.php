<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kardex', function (Blueprint $table) {
            $table->id('id_movimiento');
            $table->foreignId('id_lote')->constrained('lotes', 'id_lote')->restrictOnDelete();
            $table->enum('tipo', ['entrada', 'salida', 'ajuste']);
            $table->integer('cantidad'); // con signo: +entrada, -salida/ajuste
            $table->integer('saldo'); // cantidad_actual resultante del lote tras el movimiento
            $table->string('motivo', 150);
            $table->dateTime('fecha')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kardex');
    }
};
