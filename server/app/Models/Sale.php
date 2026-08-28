<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = ['sold_at', 'total', 'status', 'client_id', 'user_id', 'cash_register_id'];

    protected $casts = ['sold_at' => 'datetime', 'total' => 'decimal:2'];

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))->when(isset($filters['client_id']), fn ($query) => $query->where('client_id', $filters['client_id']));
    }

    public function scopeSort(Builder $query, string $column = 'sold_at', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'sold_at', 'total', 'status', 'created_at'], true) ? $column : 'sold_at', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function details()
    {
        return $this->hasMany(SaleDetail::class);
    }
}
