<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['login' => 'required|string', 'password' => 'required|string']);
        $user = User::where('email', $data['login'])->orWhere('name', $data['login'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['login' => ['Credenciales inválidas. Revísalas e intenta de nuevo.']]);
        }
        if ($user->state !== 'active') {
            throw ValidationException::withMessages(['login' => ['El usuario está inactivo. Contacta al administrador.']]);
        }

        return response()->json(['token' => $user->createToken('api')->accessToken, 'user' => $user->load('roles')]);
    }

    public function logout(Request $request)
    {
        $request->user()->token()->revoke();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }
}
