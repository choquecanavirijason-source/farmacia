<?php

namespace App\Models;

use App\Observers\AuditObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
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

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ?: trim("{$this->firstname} {$this->lastname}"),
            set: fn ($value) => $value ?: trim("{$this->firstname} {$this->lastname}")
        );
    }

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if (empty($user->name) || $user->isDirty(['firstname', 'lastname'])) {
                $fullName = trim("{$user->firstname} {$user->lastname}");
                if (!empty($fullName)) {
                    $user->name = $fullName;
                }
            }
        });
    }

    public function scopeExcludeAdmin(Builder $query): Builder
    {
        return $query->where('id', '!=', 1)
            ->where('username', '!=', 'admin')
            ->where('email', '!=', 'admin@farmacia.bo')
            ->where('email', '!=', 'admin@farmacia.com');
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%")
            ->orWhere('username', 'like', "%{$search}%")
            ->orWhere('firstname', 'like', "%{$search}%")
            ->orWhere('lastname', 'like', "%{$search}%"));
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query->when(isset($filters['status']), function (Builder $query) use ($filters) {
            if ($filters['status'] === 'trashed') {
                $query->onlyTrashed();
            } elseif ($filters['status'] === 'all') {
                $query->withTrashed();
            }
        });
    }

    public function scopeSort(Builder $query, string $column = 'name', string $direction = 'asc'): Builder
    {
        return $query->orderBy(
            in_array($column, ['id', 'name', 'email', 'username', 'firstname', 'lastname', 'created_at'], true) ? $column : 'name',
            strtolower($direction) === 'desc' ? 'desc' : 'asc'
        );
    }
}
