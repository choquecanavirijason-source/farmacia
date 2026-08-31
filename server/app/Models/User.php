<?php

namespace App\Models;

use App\Observers\AuditObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;
use Spatie\Permission\Traits\HasRoles;

#[ObservedBy([AuditObserver::class])]
class User extends Authenticatable implements Auditable
{
    use AuditableTrait, HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'firstname',
        'lastname',
        'password',
        'state',
        'created_id',
        'updated_id',
        'deleted_id',
        'restored_id',
        'restored_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'restored_at'       => 'datetime',
            'deleted_at'        => 'datetime',
        ];
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('firstname', 'like', "%{$search}%")->orWhere('lastname', 'like', "%{$search}%"));
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['state']), fn ($query) => $query->where('state', $filters['state']));
    }

    public function scopeSort(Builder $query, string $column = 'name', string $direction = 'asc'): Builder
    {
        return $query->orderBy(in_array($column, ['id', 'name', 'email', 'firstname', 'lastname', 'state', 'created_at'], true) ? $column : 'name', strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }
}
