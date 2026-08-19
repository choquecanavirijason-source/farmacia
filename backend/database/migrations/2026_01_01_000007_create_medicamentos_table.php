<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicamentos', function (Blueprint $table) {
            $table->id('id_medicamento');
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 150);
            $table->string('concentracion', 60)->nullable();
            $table->decimal('precio_venta', 10, 2);
            $table->unsignedInteger('stock_minimo')->default(0);
            $table->boolean('requiere_receta')->default(false);
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            $table->foreignId('id_categoria')->constrained('categorias', 'id_categoria')->restrictOnDelete();
            $table->foreignId('id_presentacion')->constrained('presentaciones', 'id_presentacion')->restrictOnDelete();
            $table->foreignId('id_laboratorio')->constrained('laboratorios', 'id_laboratorio')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicamentos');
    }
};
