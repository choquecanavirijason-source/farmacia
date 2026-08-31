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
class Sale extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes;

    protected $fillable = [
        'sale_date',
        'total',
        'status',
        'client_id',
        'user_id',
        'cash_register_id',
        'payment_method_id',
        'created_id',
        'updated_id',
        'deleted_id',
        'restored_id',
        'restored_at',
    ];

    protected function casts(): array
    {
        return [
            'sale_date'   => 'datetime',
            'total'       => 'decimal:2',
            'restored_at' => 'datetime',
            'deleted_at'  => 'datetime',
        ];
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))->when(isset($filters['client_id']), fn ($query) => $query->where('client_id', $filters['client_id']));
    }

    public function scopeSort(Builder $query, string $column = 'sale_date', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'sale_date', 'total', 'status', 'created_at'], true) ? $column : 'sale_date', strtolower($direction) === 'asc' ? 'asc' : 'desc');
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
