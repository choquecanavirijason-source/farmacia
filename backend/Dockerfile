FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --ignore-platform-reqs --prefer-dist

FROM php:8.2-fpm-alpine AS base

RUN apk add --no-cache \
        icu-dev \
        libzip-dev \
        libpng-dev \
        oniguruma-dev \
        freetype-dev \
        libjpeg-turbo-dev \
        supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache

WORKDIR /var/www/html

COPY --from=vendor /usr/bin/composer /usr/bin/composer

COPY docker/php/local.ini /usr/local/etc/php/conf.d/local.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY --from=vendor /app/vendor ./vendor
COPY . .

RUN addgroup -g 1000 www && adduser -G www -u 1000 -D www \
    && chown -R www:www /var/www/html \
    && chmod -R 775 storage bootstrap/cache

USER www

EXPOSE 9000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
