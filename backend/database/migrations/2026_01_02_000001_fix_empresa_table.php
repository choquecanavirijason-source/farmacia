<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // La migración original creó 'id' genérico en vez de 'id_empresa' (todas las
        // demás tablas usan PK con nombre de dominio) y 'logo_path' como VARCHAR(255),
        // demasiado corto para el data URL base64 que guarda el frontend.
        DB::statement('ALTER TABLE empresa CHANGE id id_empresa BIGINT UNSIGNED AUTO_INCREMENT');
        DB::statement('ALTER TABLE empresa MODIFY logo_path LONGTEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE empresa CHANGE id_empresa id BIGINT UNSIGNED AUTO_INCREMENT');
        DB::statement('ALTER TABLE empresa MODIFY logo_path VARCHAR(255) NULL');
    }
};
