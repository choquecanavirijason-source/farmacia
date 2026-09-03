<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * Búsqueda de texto insensible a mayúsculas/minúsculas Y a tildes (María = maria = MARIA).
 * Un `like`/`ilike` normal en Postgres no ignora tildes, así que se usa la extensión
 * `unaccent` (habilitada en la migración enable_unaccent_extension) sobre ambos lados
 * de la comparación.
 */
trait Searchable
{
    public function scopeWhereLike(Builder $query, string $column, string $value): Builder
    {
        return $query->whereRaw("unaccent(lower({$column})) LIKE unaccent(lower(?))", ["%{$value}%"]);
    }

    public function scopeOrWhereLike(Builder $query, string $column, string $value): Builder
    {
        return $query->orWhereRaw("unaccent(lower({$column})) LIKE unaccent(lower(?))", ["%{$value}%"]);
    }
}
