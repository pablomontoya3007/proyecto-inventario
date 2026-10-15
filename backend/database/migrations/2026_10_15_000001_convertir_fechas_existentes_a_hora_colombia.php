<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Hasta el 15/10/2026 la aplicación corría en UTC (config/app.php), así
 * que TODAS las fechas con hora se guardaron 5 horas adelantadas
 * respecto a Colombia. Desde ese día la aplicación usa America/Bogota.
 *
 * Sin esta migración, los registros viejos se seguirían viendo mal:
 * Laravel leería "13:26" (que en realidad era la 1:26 p. m. UTC) como
 * si fuera la 1:26 p. m. de Colombia. Aquí se les resta 5 horas UNA
 * sola vez (la tabla migrations garantiza que no se repita).
 *
 * Por qué siempre 5 horas: Colombia no tiene horario de verano desde
 * 1993, así que la diferencia con UTC es constante.
 *
 * Qué columnas: todas las de tipo datetime/timestamp de la base,
 * detectadas automáticamente (created_at, updated_at, deleted_at,
 * resuelta_en, expires_at de los tokens de sesión...). Así no se
 * escapa ninguna tabla, incluidas las que se agreguen antes de correrla.
 * Las columnas de solo fecha (fecha_programada, fecha_traslado...) NO
 * se tocan: casi todas las escribe una persona, no el reloj.
 *
 * Cada tabla se actualiza con UN solo UPDATE que asigna todas sus
 * columnas a la vez: si MariaDB tuviera alguna columna con
 * "ON UPDATE CURRENT_TIMESTAMP", asignarla explícitamente evita que se
 * sobrescriba con la hora actual.
 *
 * Se usa SQL directo (no Eloquent) a propósito: no dispara la auditoría
 * ni cambia updated_at.
 */
return new class extends Migration
{
    private const HORAS_DIFERENCIA = 5;

    public function up(): void
    {
        $this->desplazar('-');
    }

    public function down(): void
    {
        $this->desplazar('+');
    }

    private function desplazar(string $signo): void
    {
        // En SQLite (pruebas) la base siempre nace vacía: no hay nada que corregir.
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $columnasPorTabla = collect(DB::select(
            "SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND DATA_TYPE IN ('datetime', 'timestamp')
             ORDER BY TABLE_NAME, ORDINAL_POSITION"
        ))->groupBy('tabla');

        foreach ($columnasPorTabla as $tabla => $columnas) {
            $asignaciones = $columnas
                ->map(fn ($c) => sprintf(
                    '`%1$s` = `%1$s` %2$s INTERVAL %3$d HOUR',
                    $c->columna,
                    $signo,
                    self::HORAS_DIFERENCIA
                ))
                ->implode(', ');

            DB::statement(sprintf('UPDATE `%s` SET %s', $tabla, $asignaciones));
        }
    }
};