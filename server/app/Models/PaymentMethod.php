<?php

namespace App\Models;

use App\Observers\AuditObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

#[ObservedBy([AuditObserver::class])]
class PaymentMethod extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'status',
        'created_id',
        'updated_id',
        'deleted_id',
        'restored_id',
        'restored_at',
    ];

    protected function casts(): array
    {
        return [
            'restored_at' => 'datetime',
            'deleted_at'  => 'datetime',
        ];
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('name', 'like', "%{$search}%");
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']));
    }

    public function scopeSort(Builder $query, string $column = 'name', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'name', 'status', 'created_at'], true) ? $column : 'name', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }
}
