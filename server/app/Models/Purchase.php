<?php

namespace App\Models;

use App\Observers\AuditObserver;
use App\Traits\Searchable;
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
    use AuditableTrait, HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'invoice_number',
        'purchase_date',
        'total',
        'supplier_id',
        'branch_id',
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
        return $query->where(function (Builder $q) use ($search) {
            $q->whereLike('invoice_number', $search)
              ->orWhereHas('supplier', function (Builder $sq) use ($search) {
                  $sq->whereLike('name', $search)
                     ->orWhereLike('nit', $search);
              });
        });
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when(!empty($filters['supplier_id']), fn ($q) => $q->where('supplier_id', $filters['supplier_id']))
            ->when(!empty($filters['branch_id']), fn ($q) => $q->where('branch_id', $filters['branch_id']))
            ->when(!empty($filters['start_date']), fn ($q) => $q->whereDate('purchase_date', '>=', $filters['start_date']))
            ->when(!empty($filters['end_date']), fn ($q) => $q->whereDate('purchase_date', '<=', $filters['end_date']));
    }

    public function scopeSort(Builder $query, string $column = 'purchase_date', string $direction = 'desc'): Builder
    {
        return $query->orderBy(
            in_array($column, ['id', 'invoice_number', 'purchase_date', 'total', 'created_at'], true) ? $column : 'purchase_date',
            strtolower($direction) === 'asc' ? 'asc' : 'desc'
        );
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function details()
    {
        return $this->hasMany(PurchaseDetail::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
