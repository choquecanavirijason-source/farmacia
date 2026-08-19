<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facturas', function (Blueprint $table) {
            $table->id('id_factura');
            $table->foreignId('id_venta')->constrained('ventas', 'id_venta')->restrictOnDelete();
            $table->string('numero_factura', 30)->unique();
            $table->string('nit_cliente', 30);
            $table->string('razon_social', 150);
            $table->dateTime('fecha_emision')->useCurrent();
            $table->decimal('total', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};
