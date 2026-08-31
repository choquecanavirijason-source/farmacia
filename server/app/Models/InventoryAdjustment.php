<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    protected $fillable = ['batch_id', 'quantity', 'reason', 'user_id', 'occurred_at'];

    protected $casts = ['occurred_at' => 'datetime'];
}
