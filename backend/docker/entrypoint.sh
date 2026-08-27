#!/bin/sh
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ -z "$(grep '^APP_KEY=.\+' .env || true)" ]; then
    php artisan key:generate --force
fi

if [ "$DB_CONNECTION" = "mysql" ]; then
    echo "Esperando base de datos en $DB_HOST:$DB_PORT..."
    until nc -z "$DB_HOST" "${DB_PORT:-3306}"; do
        sleep 1
    done
fi

php artisan config:cache
php artisan route:cache
php artisan migrate --force

exec "$@"
