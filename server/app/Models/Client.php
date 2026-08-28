<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = ['firstname', 'lastname', 'ci', 'nit', 'phone', 'address'];

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(fn (Builder $query) => $query
            ->where('firstname', 'like', "%{$search}%")
            ->orWhere('lastname', 'like', "%{$search}%")
            ->orWhere('ci', 'like', "%{$search}%")
            ->orWhere('nit', 'like', "%{$search}%"));
    }

    public function scopeSort(Builder $query, string $column = 'firstname', string $direction = 'asc'): Builder
    {
        $column = in_array($column, ['id', 'firstname', 'lastname', 'ci', 'nit', 'phone', 'address', 'created_at'], true) ? $column : 'firstname';

        return $query->orderBy($column, strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }
}
