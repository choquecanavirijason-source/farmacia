<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trazabilidad específica de bajas de inventario (vencimiento/daño/extravío/otro).
        // Cada ajuste también genera su movimiento espejo en `kardex` (tipo "ajuste").
        Schema::create('ajustes_inventario', function (Blueprint $table) {
            $table->id('id_ajuste');
            $table->foreignId('id_lote')->constrained('lotes', 'id_lote')->restrictOnDelete();
            $table->unsignedInteger('cantidad');
            $table->enum('motivo', ['Vencimiento', 'Daño', 'Extravío', 'Otro']);
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->restrictOnDelete();
            $table->dateTime('fecha')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ajustes_inventario');
    }
};
