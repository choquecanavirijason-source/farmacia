<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = ['invoice_number', 'purchase_date', 'total', 'supplier_id'];

    protected $casts = ['purchase_date' => 'date', 'total' => 'decimal:2'];

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('invoice_number', 'like', "%{$search}%");
    }

    public function scopeSort(Builder $query, string $column = 'purchase_date', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'invoice_number', 'purchase_date', 'total', 'created_at'], true) ? $column : 'purchase_date', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function details()
    {
        return $this->hasMany(PurchaseDetail::class);
    }
}
