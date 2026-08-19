<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->string('nombre', 120);
            $table->string('usuario', 60)->unique();
            $table->string('contrasena'); // hash
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            $table->date('fecha_registro')->useCurrent();
            $table->foreignId('id_rol')->constrained('roles', 'id_rol')->restrictOnDelete();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
