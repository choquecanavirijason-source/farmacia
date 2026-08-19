<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Presentacion extends Model
{
    use HasFactory;

    protected $table = 'presentaciones';
    protected $primaryKey = 'id_presentacion';

    protected $fillable = ['nombre', 'descripcion'];

    public function medicamentos(): HasMany
    {
        return $this->hasMany(Medicamento::class, 'id_presentacion', 'id_presentacion');
    }
}
