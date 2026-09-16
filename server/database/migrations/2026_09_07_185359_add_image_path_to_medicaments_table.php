<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            // Ruta relativa dentro del disco configurado en MEDICAMENT_IMAGES_DISK (ver config/services.php).
            // No se guarda la URL completa a propósito: si el disco cambia de "public" a "s3" más adelante,
            // la URL se recalcula sola (Medicament::image_url) sin tener que migrar datos existentes.
            $table->string('image_path')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
