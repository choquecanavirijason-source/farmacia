<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cajas', function (Blueprint $table) {
            $table->id('id_caja');
            $table->dateTime('fecha_apertura');
            $table->decimal('monto_apertura', 10, 2);
            $table->dateTime('fecha_cierre')->nullable();
            $table->decimal('monto_cierre', 10, 2)->nullable();
            $table->decimal('monto_esperado_cierre', 10, 2)->nullable();
            $table->enum('estado', ['abierta', 'cerrada'])->default('abierta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cajas');
    }
};
