<?php

namespace App\Traits;

use Illuminate\Http\Request;

/**
 * Resuelve el filtro de sucursal para listados/exportaciones (nunca para creación de datos).
 * Semántica del parámetro `branch_id` en query string:
 * - ausente por completo  -> se asume la sucursal activa del usuario (comportamiento por defecto).
 * - "all" (o vacío)       -> sin filtro, ve datos de todas las sucursales.
 * - un id numérico        -> filtra por esa sucursal específica.
 */
trait ResolvesBranchScope
{
    protected function resolveBranchScope(Request $request): ?int
    {
        $param = $request->query('branch_id');

        if ($param === null) {
            $activeBranchId = $request->user()?->active_branch_id;
            return $activeBranchId ? (int) $activeBranchId : null;
        }

        if ($param === 'all' || $param === '') {
            return null;
        }

        return (int) $param;
    }
}
