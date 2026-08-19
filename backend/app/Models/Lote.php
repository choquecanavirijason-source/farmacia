<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lote extends Model
{
    use HasFactory;

    protected $table = 'lotes';
    protected $primaryKey = 'id_lote';

    protected $fillable = [
        'numero_lote', 'fecha_vencimiento', 'cantidad_actual', 'precio_compra', 'id_medicamento',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'date',
        'precio_compra' => 'decimal:2',
    ];

    public function medicamento(): BelongsTo
    {
        return $this->belongsTo(Medicamento::class, 'id_medicamento', 'id_medicamento');
    }

    public function kardex(): HasMany
    {
        return $this->hasMany(Kardex::class, 'id_lote', 'id_lote');
    }

    public function ajustes(): HasMany
    {
        return $this->hasMany(AjusteInventario::class, 'id_lote', 'id_lote');
    }
}
