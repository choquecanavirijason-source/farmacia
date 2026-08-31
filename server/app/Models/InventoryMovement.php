<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    protected $fillable = ['batch_id', 'type', 'quantity', 'balance', 'reason', 'occurred_at'];

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['batch_id']), fn ($query) => $query->where('batch_id', $filters['batch_id']))->when(isset($filters['type']), fn ($query) => $query->where('type', $filters['type']));
    }

    public function scopeSort(Builder $query, string $column = 'occurred_at', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'batch_id', 'type', 'quantity', 'occurred_at'], true) ? $column : 'occurred_at', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }

    protected $casts = ['occurred_at' => 'datetime'];
}
