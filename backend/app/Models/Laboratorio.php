<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laboratorio extends Model
{
    use HasFactory;

    protected $table = 'laboratorios';
    protected $primaryKey = 'id_laboratorio';

    protected $fillable = ['nombre', 'pais', 'telefono'];

    public function medicamentos(): HasMany
    {
        return $this->hasMany(Medicamento::class, 'id_laboratorio', 'id_laboratorio');
    }
}
