<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = ['batch_number', 'expiration_date', 'current_quantity', 'purchase_price', 'medicament_id'];

    protected $casts = ['expiration_date' => 'date', 'purchase_price' => 'decimal:2'];

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('batch_number', 'like', "%{$search}%");
    }

    public function scopeSort(Builder $query, string $column = 'expiration_date', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'batch_number', 'expiration_date', 'current_quantity', 'created_at'], true) ? $column : 'expiration_date', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }

    public function medicament()
    {
        return $this->belongsTo(Medicament::class);
    }
}
