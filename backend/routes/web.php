<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Sirve el build estático del frontend Next.js (npm run build:laravel lo
| copia a public/). Cada ruta de la SPA exporta su propio index.html
| (out/dashboard/index.html, etc.); esta ruta comodín resuelve la URL sin
| extensión al archivo correspondiente. Los assets (_next/*, favicon, etc.)
| ya existen como archivos reales en public/ y el servidor los sirve
| directamente antes de llegar aquí.
|
*/

Route::get('/{path?}', function (string $path = '') {
    $path = trim($path, '/');

    $candidates = $path === ''
        ? [public_path('index.html')]
        : [public_path("{$path}/index.html"), public_path("{$path}.html")];

    foreach ($candidates as $file) {
        if (is_file($file)) {
            return response()->file($file, ['Content-Type' => 'text/html; charset=UTF-8']);
        }
    }

    abort(404);
})->where('path', '.*');
