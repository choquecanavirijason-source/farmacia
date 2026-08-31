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
class Company extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'nit',
        'address',
        'phone',
        'email',
        'logo_path',
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
        return $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('nit', 'like', "%{$search}%"));
    }

    public function scopeSort(Builder $query, string $column = 'name', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'name', 'nit', 'created_at'], true) ? $column : 'name', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }
}
