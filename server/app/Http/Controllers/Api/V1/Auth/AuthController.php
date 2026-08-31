<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Requests\Auth\AuthRequest;
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

        return $this->_generateTokenAndResponse_($user);
    }

    public function logout(Request $request)
    {
        $request->user()->token()->revoke();

        return $this->_successResponse_('Sesión cerrada.');
    }

    public function me(Request $request)
    {
        return $this->_generateResponse_($request->user());
    }
}
