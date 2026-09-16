<?php

namespace App\Models;

use App\Observers\AuditObserver;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

#[ObservedBy([AuditObserver::class])]
class Client extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'firstname',
        'lastname',
        'ci',
        'nit',
        'phone',
        'address',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_id');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_id');
    }

    public function restoredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_id');
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(fn (Builder $query) => $query
            ->whereLike('firstname', $search)
            ->orWhereLike('lastname', $search)
            ->orWhereLike('ci', $search)
            ->orWhereLike('nit', $search));
    }

    public function scopeSort(Builder $query, string $column = 'id', string $direction = 'desc'): Builder
    {
        $column = in_array($column, ['id', 'firstname', 'lastname', 'ci', 'nit', 'phone', 'address', 'created_at'], true) ? $column : 'firstname';

        return $query->orderBy($column, strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }
}
