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

// Llaves de encriptacion de Passport (no hace nada si ya existen)
Illuminate\Support\Facades\Artisan::call('passport:keys', ['--force' => false]);
echo htmlspecialchars(Illuminate\Support\Facades\Artisan::output());

// Cliente "personal access" que createToken() necesita para firmar tokens.
// Passport 13 no tiene tabla propia para esto: es un oauth_clients normal con
// grant_types = ["personal_access"]. Solo se crea si todavia no existe uno,
// para poder correr este script mas de una vez.
$hasPersonalClient = Illuminate\Support\Facades\DB::table('oauth_clients')
    ->where('grant_types', 'like', '%personal_access%')
    ->exists();
if (!$hasPersonalClient) {
    Illuminate\Support\Facades\Artisan::call('passport:client', [
        '--personal' => true,
        '--name' => 'Farmacia Personal Access Client',
        '--no-interaction' => true,
    ]);
    echo htmlspecialchars(Illuminate\Support\Facades\Artisan::output());
}

// Datos de demo (empresa, roles, usuarios, catalogo, ventas de ejemplo).
// Solo se corre si la base esta vacia, para no duplicar datos si se re-ejecuta el script.
if (Illuminate\Support\Facades\DB::table('users')->count() === 0) {
    Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    echo htmlspecialchars(Illuminate\Support\Facades\Artisan::output());
}

// Symlink de storage para las fotos de medicamentos. No usamos "artisan storage:link"
// porque ese comando asume que public/ esta pegado a Laravel; aca public_html vive
// separado, asi que armamos el symlink a mano apuntando a la carpeta correcta.
$storageLink = __DIR__ . '/storage';
if (!file_exists($storageLink)) {
    if (@symlink('../laravel_farmacia/storage/app/public', $storageLink)) {
        echo "Symlink de storage creado correctamente.\n";
    } else {
        echo "No se pudo crear el symlink de storage (revisar permisos del hosting).\n";
    }
} else {
    echo "El symlink/carpeta de storage ya existe, no se toco.\n";
}

echo '</pre>';
echo '<p><strong>Borra este archivo (deploy-migrate.php) ahora mismo.</strong></p>';
