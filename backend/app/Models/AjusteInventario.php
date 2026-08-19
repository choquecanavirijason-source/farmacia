<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AjusteInventario extends Model
{
    use HasFactory;

    protected $table = 'ajustes_inventario';
    protected $primaryKey = 'id_ajuste';

    protected $fillable = ['id_lote', 'cantidad', 'motivo', 'id_usuario', 'fecha'];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'id_lote', 'id_lote');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
