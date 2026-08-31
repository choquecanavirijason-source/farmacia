<?php

namespace App\Traits\Auth;

use App\Http\Resources\Auth\AuthResource;
use App\Http\Resources\Auth\MeResource;
use App\Http\Resources\Auth\ProfileResource;
use App\Models\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordMail;

trait AuthTrait
{
    private function _generateTokenAndResponse_($user)
    {
        $tokenResult = $user->createToken('PersonalAccessToken');
        $token = $tokenResult->token;
        $token->save();

        return new AuthResource((object)[
            'access_token' => $tokenResult->accessToken,
            'expires_at' => $token->expires_at,
            'user' => $user,
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
        ]);
    }

    private function _generateResponse_($user)
    {
         return new MeResource((object)[
            'user' => $user,
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
        ]);
    }

    private function _generateProfileResponse_($user)
    {
         return new ProfileResource($user);
    }

    private function _sendResetEmail_($user)
    {
        PasswordReset::where('email', $user->email)->delete();

        $token = Str::random(60);
        
        PasswordReset::create([
            'email'      => $user->email,
            'token'      => hash('sha256', $token),
            'created_at' => now(),
        ]);

        Mail::to($user->email)->send(new ResetPasswordMail($token));
    }

    private function _successResponse_($message, $status = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message
        ], $status);
    }

    private function _errorResponse_($message, $status = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $status);
    }
}