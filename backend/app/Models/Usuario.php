<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';

    protected $fillable = ['nombre', 'usuario', 'contrasena', 'estado', 'fecha_registro', 'id_rol'];

    protected $hidden = ['contrasena', 'remember_token'];

    protected $casts = [
        'fecha_registro' => 'date',
    ];

    public function getAuthPassword()
    {
        return $this->contrasena;
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'id_usuario', 'id_usuario');
    }

    public function ajustesInventario(): HasMany
    {
        return $this->hasMany(AjusteInventario::class, 'id_usuario', 'id_usuario');
    }
}
