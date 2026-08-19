<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lotes', function (Blueprint $table) {
            $table->id('id_lote');
            $table->string('numero_lote', 60);
            $table->date('fecha_vencimiento');
            $table->unsignedInteger('cantidad_actual')->default(0);
            $table->decimal('precio_compra', 10, 2);
            $table->foreignId('id_medicamento')->constrained('medicamentos', 'id_medicamento')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['id_medicamento', 'numero_lote']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lotes');
    }
};
