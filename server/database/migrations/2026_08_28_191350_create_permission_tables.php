<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $teams = config('permission.teams', false);
        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');
        $pivotRole = $columnNames['role_pivot_key'] ?? 'role_id';
        $pivotPermission = $columnNames['permission_pivot_key'] ?? 'permission_id';

        if (empty($tableNames)) {
            throw new RuntimeException('Error: config/permission.php is missing. Run [php artisan vendor:publish --provider="Spatie\\Permission\\PermissionServiceProvider"].');
        }

        Schema::create($tableNames['permissions'], function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        Schema::create($tableNames['model_has_permissions'], function (Blueprint $table) use ($columnNames, $pivotPermission, $teams) {
            $table->unsignedBigInteger($pivotPermission);
            $table->string('model_type');
            $table->unsignedBigInteger($columnNames['model_morph_key'] ?? 'model_id');
            $table->index([$columnNames['model_morph_key'] ?? 'model_id', 'model_type']);
            $table->foreign($pivotPermission)->references('id')->on($columnNames['permissions'] ?? 'permissions')->cascadeOnDelete();
            if ($teams) {
                $table->unsignedBigInteger($columnNames['team_foreign_key'] ?? 'team_id');
                $table->index($columnNames['team_foreign_key'] ?? 'team_id');
                $table->primary([$columnNames['team_foreign_key'] ?? 'team_id', $pivotPermission, $columnNames['model_morph_key'] ?? 'model_id', 'model_type']);
            } else {
                $table->primary([$pivotPermission, $columnNames['model_morph_key'] ?? 'model_id', 'model_type']);
            }
        });

        Schema::create($tableNames['model_has_roles'], function (Blueprint $table) use ($columnNames, $pivotRole, $teams) {
            $table->unsignedBigInteger($pivotRole);
            $table->string('model_type');
            $table->unsignedBigInteger($columnNames['model_morph_key'] ?? 'model_id');
            $table->index([$columnNames['model_morph_key'] ?? 'model_id', 'model_type']);
            $table->foreign($pivotRole)->references('id')->on($columnNames['roles'] ?? 'roles')->cascadeOnDelete();
            if ($teams) {
                $table->unsignedBigInteger($columnNames['team_foreign_key'] ?? 'team_id');
                $table->index($columnNames['team_foreign_key'] ?? 'team_id');
                $table->primary([$columnNames['team_foreign_key'] ?? 'team_id', $pivotRole, $columnNames['model_morph_key'] ?? 'model_id', 'model_type']);
            } else {
                $table->primary([$pivotRole, $columnNames['model_morph_key'] ?? 'model_id', 'model_type']);
            }
        });

        Schema::create($tableNames['role_has_permissions'], function (Blueprint $table) use ($pivotRole, $pivotPermission) {
            $table->unsignedBigInteger($pivotPermission);
            $table->unsignedBigInteger($pivotRole);
            $table->foreign($pivotPermission)->references('id')->on('permissions')->cascadeOnDelete();
            $table->foreign($pivotRole)->references('id')->on('roles')->cascadeOnDelete();
            $table->primary([$pivotPermission, $pivotRole]);
        });
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');
        Schema::dropIfExists($tableNames['role_has_permissions']);
        Schema::dropIfExists($tableNames['model_has_roles']);
        Schema::dropIfExists($tableNames['model_has_permissions']);
        Schema::dropIfExists($tableNames['permissions']);
    }
};
