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
class Batch extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes;

    protected $fillable = [
        'batch_number',
        'expiration_date',
        'current_quantity',
        'purchase_price',
        'medicament_id',
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
        return $query->where('batch_number', 'like', "%{$search}%");
    }

    public function scopeSort(Builder $query, string $column = 'expiration_date', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'batch_number', 'expiration_date', 'current_quantity', 'created_at'], true) ? $column : 'expiration_date', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }

    public function medicament()
    {
        return $this->belongsTo(Medicament::class);
    }
}
