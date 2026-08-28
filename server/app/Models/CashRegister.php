<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    use HasFactory;

    protected $fillable = ['opened_at', 'opening_amount', 'closed_at', 'closing_amount', 'expected_closing_amount', 'status'];

    protected $casts = ['opened_at' => 'datetime', 'closed_at' => 'datetime', 'opening_amount' => 'decimal:2', 'closing_amount' => 'decimal:2', 'expected_closing_amount' => 'decimal:2'];

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']));
    }

    public function scopeSort(Builder $query, string $column = 'opened_at', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'opened_at', 'closed_at', 'status', 'created_at'], true) ? $column : 'opened_at', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }
}
