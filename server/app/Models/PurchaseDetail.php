<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseDetail extends Model
{
    protected $fillable = ['purchase_id', 'medicament_id', 'batch_id', 'quantity', 'unit_price', 'subtotal'];

    protected $casts = ['unit_price' => 'decimal:2', 'subtotal' => 'decimal:2'];
}
