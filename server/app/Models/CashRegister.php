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
class CashRegister extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes;

    protected $fillable = [
        'opened_at',
        'opening_amount',
        'closed_at',
        'closing_amount',
        'expected_closing_amount',
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
            'opened_at'               => 'datetime',
            'closed_at'               => 'datetime',
            'opening_amount'          => 'decimal:2',
            'closing_amount'          => 'decimal:2',
            'expected_closing_amount' => 'decimal:2',
            'restored_at'             => 'datetime',
            'deleted_at'              => 'datetime',
        ];
    }

    protected $appends = [
        'opening_date',
        'closing_date',
    ];

    public function getOpeningDateAttribute()
    {
        return $this->opened_at;
    }

    public function getClosingDateAttribute()
    {
        return $this->closed_at;
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']));
    }

    public function scopeSort(Builder $query, string $column = 'opened_at', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'opened_at', 'closed_at', 'status', 'created_at'], true) ? $column : 'opened_at', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }

    public function movements()
    {
        return $this->hasMany(CashMovement::class);
    }
}
