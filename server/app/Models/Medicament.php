<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicament extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'name', 'concentration', 'price', 'min_stock',
        'requires_prescription', 'status', 'laboratory_id', 'category_id', 'presentation_id',
    ];

    protected $casts = ['price' => 'decimal:2', 'requires_prescription' => 'boolean'];

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(fn (Builder $query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
    }

    public function scopeSort(Builder $query, string $column = 'name', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'code', 'name', 'price', 'min_stock', 'status', 'created_at'], true) ? $column : 'name', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), fn (Builder $query) => $query->where('status', $filters['status']))->when(isset($filters['category_id']), fn (Builder $query) => $query->where('category_id', $filters['category_id']));
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function presentation()
    {
        return $this->belongsTo(Presentation::class);
    }

    public function laboratory()
    {
        return $this->belongsTo(Laboratory::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }
}
