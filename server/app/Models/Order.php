<?php

namespace App\Models;

use App\Observers\AuditObserver;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

#[ObservedBy([AuditObserver::class])]
class Order extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'order_number',
        'user_id',
        'total',
        'status',
        'contact_name',
        'contact_phone',
        'notes',
        'branch_id',
        'confirmed_at',
        'completed_at',
        'created_id',
        'updated_id',
        'deleted_id',
        'restored_id',
        'restored_at',
    ];

    protected function casts(): array
    {
        return [
            'total'        => 'decimal:2',
            'confirmed_at' => 'datetime',
            'completed_at' => 'datetime',
            'restored_at'  => 'datetime',
            'deleted_at'   => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->order_number)) {
                $order->order_number = 'PED-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5));
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function details()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->whereLike('order_number', $search)
                ->orWhereLike('contact_name', $search)
                ->orWhereLike('contact_phone', $search);
        });
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when(!empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->when(!empty($filters['branch_id']), fn ($q) => $q->where('branch_id', $filters['branch_id']))
            ->when(!empty($filters['user_id']), fn ($q) => $q->where('user_id', $filters['user_id']));
    }

    public function scopeSort(Builder $query, string $column = 'created_at', string $direction = 'desc'): Builder
    {
        $validColumns = ['id', 'order_number', 'total', 'status', 'created_at'];

        return $query->orderBy(
            in_array($column, $validColumns, true) ? $column : 'created_at',
            strtolower($direction) === 'asc' ? 'asc' : 'desc'
        );
    }
}
