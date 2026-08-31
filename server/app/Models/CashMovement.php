<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    protected $fillable = ['cash_register_id', 'type', 'amount', 'description', 'occurred_at'];

    protected $casts = ['amount' => 'decimal:2', 'occurred_at' => 'datetime'];

    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }
}
