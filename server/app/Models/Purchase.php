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
class Purchase extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'purchase_date',
        'total',
        'supplier_id',
        'created_id',
        'updated_id',
        'deleted_id',
        'restored_id',
        'restored_at',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'total'         => 'decimal:2',
            'restored_at'   => 'datetime',
            'deleted_at'    => 'datetime',
        ];
    }

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
