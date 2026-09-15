<?php

// Script temporal para correr migraciones sin acceso a Terminal/SSH.
// USAR UNA SOLA VEZ Y BORRAR DE INMEDIATO DESPUES (o cada vez que haya migraciones nuevas).

define('LARAVEL_START', microtime(true));

$secret = 'a55d5bd5456fd4c1db50aa58070d4984be63cdb5f7000f4a';

if (($_GET['token'] ?? '') !== $secret) {
    http_response_code(403);
    exit('Forbidden');
}

require __DIR__.'/../laravel_farmacia/vendor/autoload.php';

$app = require_once __DIR__.'/../laravel_farmacia/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo '<pre>';
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
echo htmlspecialchars(Illuminate\Support\Facades\Artisan::output());
echo '</pre>';
echo '<p><strong>Borra este archivo (deploy-migrate.php) ahora mismo.</strong></p>';
