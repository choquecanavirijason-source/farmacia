<?php

namespace App\Models;

use App\Observers\AuditObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

#[ObservedBy([AuditObserver::class])]
class BranchTransfer extends Model implements Auditable
{
    use AuditableTrait;

    protected $fillable = [
        'medicament_id',
        'from_branch_id',
        'to_branch_id',
        'source_batch_id',
        'destination_batch_id',
        'quantity',
        'reason',
        'created_id',
    ];

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when(!empty($filters['medicament_id']), fn ($q) => $q->where('medicament_id', $filters['medicament_id']))
            ->when(!empty($filters['from_branch_id']), fn ($q) => $q->where('from_branch_id', $filters['from_branch_id']))
            ->when(!empty($filters['to_branch_id']), fn ($q) => $q->where('to_branch_id', $filters['to_branch_id']))
            ->when(!empty($filters['branch_id']), fn ($q) => $q->where(function (Builder $q2) use ($filters) {
                $q2->where('from_branch_id', $filters['branch_id'])
                    ->orWhere('to_branch_id', $filters['branch_id']);
            }));
    }

    public function scopeSort(Builder $query, string $column = 'created_at', string $direction = 'desc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'quantity', 'created_at'], true) ? $column : 'created_at', strtolower($direction) === 'asc' ? 'asc' : 'desc');
    }

    public function medicament()
    {
        return $this->belongsTo(Medicament::class);
    }

    public function fromBranch()
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch()
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function sourceBatch()
    {
        return $this->belongsTo(Batch::class, 'source_batch_id');
    }

    public function destinationBatch()
    {
        return $this->belongsTo(Batch::class, 'destination_batch_id');
    }
}
