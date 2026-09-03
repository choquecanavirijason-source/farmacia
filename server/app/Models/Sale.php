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
class Sale extends Model implements Auditable
{
    use AuditableTrait, HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'sold_at',
        'total',
        'status',
        'client_id',
        'user_id',
        'cash_register_id',
        'payment_method_id',
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
            'sold_at'     => 'datetime',
            'total'       => 'decimal:2',
            'restored_at' => 'datetime',
            'deleted_at'  => 'datetime',
        ];
    }

    protected $appends = [
        'sale_date',
    ];

    public function getSaleDateAttribute()
    {
        return $this->sold_at;
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(!empty($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->when(!empty($filters['client_id']), fn ($query) => $query->where('client_id', $filters['client_id']))
            ->when(!empty($filters['branch_id']), fn ($query) => $query->where('branch_id', $filters['branch_id']))
            ->when(!empty($filters['start_date']), fn ($query) => $query->whereDate('sold_at', '>=', $filters['start_date']))
            ->when(!empty($filters['end_date']), fn ($query) => $query->whereDate('sold_at', '<=', $filters['end_date']))
            ->when(!empty($filters['search']), function (Builder $query) use ($filters) {
                $search = $filters['search'];
                $query->where(function (Builder $q) use ($search) {
                    if (is_numeric($search)) {
                        $q->where('id', (int) $search);
                    }
                    $q->orWhereHas('client', function (Builder $cq) use ($search) {
                        $cq->whereLike('firstname', $search)
                            ->orWhereLike('lastname', $search)
                            ->orWhereLike('ci', $search)
                            ->orWhereLike('nit', $search);
                    })->orWhereHas('invoice', function (Builder $iq) use ($search) {
                        $iq->whereLike('invoice_number', $search)
                            ->orWhereLike('business_name', $search);
                    });
                });
            });
    }

    public function scopeSort(Builder $query, string $column = 'sold_at', string $direction = 'desc'): Builder
    {
        $validColumns = [
            'id' => 'id',
            'sold_at' => 'sold_at',
            'sale_date' => 'sold_at',
            'total' => 'total',
            'status' => 'status',
            'created_at' => 'created_at',
        ];

        $col = $validColumns[$column] ?? 'sold_at';

        return $query->orderBy(
            $col,
            strtolower($direction) === 'asc' ? 'asc' : 'desc'
        );
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function details()
    {
        return $this->hasMany(SaleDetail::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(SalePayment::class);
    }
}
