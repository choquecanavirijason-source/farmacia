<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Requests\Auth\AuthRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Traits\Auth\AuthTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController
{
    use ApiResponseTrait, AuthTrait;

    public function login(AuthRequest $request)
    {
        $data = $request->validated();

        $user = User::where('email', $data['login'])
            ->orWhere('username', $data['login'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Credenciales inválidas. Revísalas e intenta de nuevo.']
            ]);
        }

        if ($user->state !== 'active') {
            throw ValidationException::withMessages([
                'login' => ['El usuario está inactivo. Contacta al administrador.']
            ]);
        }

        if (!$user->active_branch_id) {
            $defaultBranch = $user->branches()->wherePivot('is_default', true)->first()
                ?? $user->branches()->first();

            if ($defaultBranch) {
                $user->update(['active_branch_id' => $defaultBranch->id]);
            }
        }

        $user->load('branches');

        return $this->_generateTokenAndResponse_($user);
    }

    public function logout(Request $request)
    {
        $request->user()->token()->revoke();

        return $this->_successResponse_('Sesión cerrada.');
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('branches');

        return $this->_generateResponse_($user);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        if (!empty($data['password'])) {
            if (!Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['La contraseña actual es incorrecta.']
                ]);
            }
            $user->password = $data['password'];
        }

        $user->firstname = $data['firstname'];
        $user->lastname  = $data['lastname'];
        $user->username  = $data['username'];
        $user->email     = $data['email'];
        $user->name      = trim("{$data['firstname']} {$data['lastname']}");
        $user->save();

        return $this->_generateResponse_($user->fresh());
    }
}
