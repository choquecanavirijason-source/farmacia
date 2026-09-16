<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * Búsqueda de texto insensible a mayúsculas/minúsculas Y a tildes (María = maria = MARIA).
 * En Postgres un `like`/`ilike` normal no ignora tildes, así que se usa la extensión
 * `unaccent` (habilitada en la migración enable_unaccent_extension) sobre ambos lados
 * de la comparación. En MySQL/MariaDB no hace falta: las collations *_ci por defecto
 * (utf8mb4_general_ci / utf8mb4_unicode_ci) ya ignoran tildes en comparaciones LIKE,
 * así que ahí alcanza con LOWER().
 */
trait Searchable
{
    public function scopeWhereLike(Builder $query, string $column, string $value): Builder
    {
        [$sql, $bindings] = $this->likeExpression($query, $column, $value);

        return $query->whereRaw($sql, $bindings);
    }

    public function scopeOrWhereLike(Builder $query, string $column, string $value): Builder
    {
        [$sql, $bindings] = $this->likeExpression($query, $column, $value);

        return $query->orWhereRaw($sql, $bindings);
    }

    private function likeExpression(Builder $query, string $column, string $value): array
    {
        $driver = $query->getConnection()->getDriverName();
        $like = "%{$value}%";

        if ($driver === 'pgsql') {
            return ["unaccent(lower({$column})) LIKE unaccent(lower(?))", [$like]];
        }

        return ["LOWER({$column}) LIKE LOWER(?)", [$like]];
    }
}
