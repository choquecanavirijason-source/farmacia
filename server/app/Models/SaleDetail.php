<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleDetail extends Model
{
    protected $fillable = ['sale_id', 'medicament_id', 'batch_id', 'quantity', 'unit_price', 'discount_percent', 'subtotal'];

    protected $casts = ['unit_price' => 'decimal:2', 'discount_percent' => 'decimal:2', 'subtotal' => 'decimal:2'];
}
