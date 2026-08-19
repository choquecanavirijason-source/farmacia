<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory;

    protected $table = 'categorias';
    protected $primaryKey = 'id_categoria';

    protected $fillable = ['nombre', 'descripcion'];

    public function medicamentos(): HasMany
    {
        return $this->hasMany(Medicamento::class, 'id_categoria', 'id_categoria');
    }
}
