<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compras', function (Blueprint $table) {
            $table->id('id_compra');
            $table->string('numero_factura', 60);
            $table->date('fecha');
            $table->decimal('total', 12, 2)->default(0);
            $table->foreignId('id_proveedor')->constrained('proveedores', 'id_proveedor')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['id_proveedor', 'numero_factura']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compras');
    }
};
