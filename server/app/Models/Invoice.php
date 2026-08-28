<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['sale_id', 'invoice_number', 'client_tax_id', 'business_name', 'issued_at', 'total'];

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(fn ($query) => $query->where('invoice_number', 'like', "%{$search}%")->orWhere('business_name', 'like', "%{$search}%"));
    }

    public function scopeSort(Builder $query, string $column = 'issued_at', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'invoice_number', 'issued_at', 'total', 'created_at'], true) ? $column : 'issued_at', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }

    protected $casts = ['issued_at' => 'datetime', 'total' => 'decimal:2'];
}
