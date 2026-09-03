<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $company = DB::table('companies')->orderBy('id')->first();
        if (!$company) {
            // No debería pasar en un sistema en uso, pero evita romper la migración
            // en un entorno completamente vacío.
            return;
        }

        $now = now();
        $branchId = DB::table('branches')->insertGetId([
            'company_id' => $company->id,
            'name'       => 'Sucursal Principal',
            'address'    => $company->address,
            'phone'      => $company->phone,
            'status'     => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Todos los usuarios existentes quedan asignados a la sucursal principal,
        // como su única sucursal (por defecto) y activa.
        $userIds = DB::table('users')->whereNull('deleted_at')->pluck('id');
        $pivotRows = $userIds->map(fn ($userId) => [
            'branch_id'  => $branchId,
            'user_id'    => $userId,
            'is_default' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        if (!empty($pivotRows)) {
            DB::table('branch_user')->insert($pivotRows);
        }

        DB::table('users')->update(['active_branch_id' => $branchId]);

        // Todo lo operativo existente (lotes, ventas, cajas, compras) pertenecía
        // implícitamente a la única sucursal que existía hasta ahora.
        DB::table('batches')->update(['branch_id' => $branchId]);
        DB::table('sales')->update(['branch_id' => $branchId]);
        DB::table('cash_registers')->update(['branch_id' => $branchId]);
        DB::table('purchases')->update(['branch_id' => $branchId]);
    }

    public function down(): void
    {
        // Irreversible de forma segura sin perder información de a qué sucursal
        // pertenecía cada registro; no se revierte automáticamente.
    }
};
