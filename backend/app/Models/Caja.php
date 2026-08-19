<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    use HasFactory;

    protected $table = 'cajas';
    protected $primaryKey = 'id_caja';

    protected $fillable = [
        'fecha_apertura', 'monto_apertura', 'fecha_cierre',
        'monto_cierre', 'monto_esperado_cierre', 'estado',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'id_caja', 'id_caja');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoCaja::class, 'id_caja', 'id_caja');
    }
}
