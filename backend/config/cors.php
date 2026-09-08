<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuración de CORS (Cross-Origin Resource Sharing)
    |--------------------------------------------------------------------------
    |
    | En desarrollo, el frontend (Vite, http://localhost:5173) y el backend
    | (Laravel, http://127.0.0.1:8000) corren en orígenes distintos. Sin este
    | archivo, el navegador bloquea las peticiones del frontend con un error
    | de CORS antes de que Laravel llegue siquiera a procesarlas.
    |
    | No hace falta registrar middleware adicional en bootstrap/app.php:
    | Illuminate\Http\Middleware\HandleCors ya viene activo por defecto desde
    | Laravel 11 y lee automáticamente este archivo si existe.
    |
    */

    // Rutas de la API a las que aplica esta política. No se necesita tocar
    // el resto (rutas web) porque el frontend solo consume /api/*.
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Orígenes permitidos. Vite usa el puerto 5173 por defecto en dev.
    // Si tu Vite corre en otro puerto (lo dice la terminal al hacer
    // "npm run dev"), agrégalo aquí.
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // false porque la autenticación es por token Bearer (Sanctum en modo
    // API token, no SPA con cookies). Si algún día migras a Sanctum SPA
    // (cookies de sesión), esto tendría que pasar a true y allowed_origins
    // no podría usar '*'.
    'supports_credentials' => false,

];
