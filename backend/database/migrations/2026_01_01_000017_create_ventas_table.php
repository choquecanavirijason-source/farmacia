<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->id('id_venta');
            $table->dateTime('fecha')->useCurrent();
            $table->decimal('total', 12, 2)->default(0);
            $table->enum('estado', ['activa', 'anulada'])->default('activa');
            $table->foreignId('id_cliente')->nullable()->constrained('clientes', 'id_cliente')->restrictOnDelete();
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->restrictOnDelete();
            $table->foreignId('id_caja')->constrained('cajas', 'id_caja')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};
