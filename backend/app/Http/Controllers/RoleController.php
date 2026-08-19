<?php

namespace App\Http\Controllers;

use App\Models\Rol;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(Rol::orderBy('nombre')->get());
    }
}
