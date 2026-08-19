<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormaPago extends Model
{
    use HasFactory;

    protected $table = 'formas_pago';
    protected $primaryKey = 'id_forma_pago';

    protected $fillable = ['nombre', 'estado'];

    public function pagosVenta(): HasMany
    {
        return $this->hasMany(PagoVenta::class, 'id_forma_pago', 'id_forma_pago');
    }
}
