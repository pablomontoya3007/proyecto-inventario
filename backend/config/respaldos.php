<?php

return [
    // Rutas a los ejecutables de MySQL/MariaDB. Por defecto se asume que
    // están en el PATH del sistema — si no (típico en XAMPP en Windows,
    // que NO agrega mysql/bin al PATH automáticamente), hay que poner la
    // ruta completa en el .env, por ejemplo:
    // MYSQLDUMP_PATH="C:\xampp\mysql\bin\mysqldump.exe"
    // MYSQL_PATH="C:\xampp\mysql\bin\mysql.exe"
    'mysqldump_path' => env('MYSQLDUMP_PATH', 'mysqldump'),
    'mysql_path' => env('MYSQL_PATH', 'mysql'),

    // Antes de restaurar, se genera un respaldo automático de la base
    // ACTUAL en esta carpeta (dentro de storage/app, fuera del alcance
    // público) — para poder recuperarse si la restauración fue un error.
    'carpeta_respaldo_automatico' => storage_path('app/backups-automaticos'),

    // Segundos máximos que se le dan a mysqldump/mysql antes de darlo
    // por fallido — el timeout por defecto de Process en Laravel (60s)
    // se queda corto para una base con cientos de equipos.
    'timeout_segundos' => 300,
];
