<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_venta', function (Blueprint $table) {
            $table->id('id_pago');
            $table->foreignId('id_venta')->constrained('ventas', 'id_venta')->cascadeOnDelete();
            $table->foreignId('id_forma_pago')->constrained('formas_pago', 'id_forma_pago')->restrictOnDelete();
            $table->decimal('monto', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_venta');
    }
};
