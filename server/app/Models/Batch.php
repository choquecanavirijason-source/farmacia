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
class Batch extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'batch_number',
        'expiration_date',
        'current_quantity',
        'purchase_price',
        'medicament_id',
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
            'expiration_date' => 'date',
            'purchase_price'  => 'decimal:2',
            'restored_at'     => 'datetime',
            'deleted_at'      => 'datetime',
        ];
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->whereLike('batch_number', $search)
                ->orWhereHas('medicament', function (Builder $mq) use ($search) {
                    $mq->whereLike('name', $search)
                        ->orWhereLike('code', $search);
                });
        });
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(!empty($filters['branch_id']), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']));
    }

    public function scopeSort(Builder $query, string $column = 'expiration_date', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'batch_number', 'expiration_date', 'current_quantity', 'created_at'], true) ? $column : 'expiration_date', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }

    public function medicament()
    {
        return $this->belongsTo(Medicament::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
