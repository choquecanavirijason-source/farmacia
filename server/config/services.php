<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fotos de Medicamentos
    |--------------------------------------------------------------------------
    |
    | Disco (de config/filesystems.php) donde se guardan las fotos de producto.
    | Por defecto usa "public" (disco local, sin costo, sin necesitar AWS) para
    | que la función funcione de entrada. El día que alguien configure el bucket
    | de S3 (ver .env.example), basta con cambiar MEDICAMENT_IMAGES_DISK=s3 y
    | llenar las variables AWS_* — no hace falta tocar ni una línea de código,
    | ni migrar las fotos ya subidas al disco local si no se quiere.
    |
    */
    'medicament_images' => [
        'disk' => env('MEDICAMENT_IMAGES_DISK', 'public'),
    ],

];
