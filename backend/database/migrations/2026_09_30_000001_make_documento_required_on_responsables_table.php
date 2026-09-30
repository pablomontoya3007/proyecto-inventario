<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * documento pasa a NOT NULL. Se revisa ANTES de alterar la columna:
     * si hay responsables sin documento, la migración se detiene con un
     * mensaje claro en vez de fallar a medias con un error de MySQL.
     *
     * DB::table() (y no el modelo) a propósito: no aplica el scope de
     * SoftDeletes, así que también cuenta los responsables eliminados —
     * NOT NULL aplica a todas las filas, eliminadas o no.
     *
     * El índice único existente se conserva: change() solo modifica la
     * definición de la columna, no sus índices.
     */
    public function up(): void
    {
        $sinDocumento = DB::table('responsables')->whereNull('documento')->count();

        if ($sinDocumento > 0) {
            throw new RuntimeException(
                "No se puede aplicar: hay {$sinDocumento} responsable(s) sin documento (incluidos los eliminados). "
                .'Complétalos antes de volver a ejecutar la migración.'
            );
        }

        Schema::table('responsables', function (Blueprint $table) {
            $table->string('documento', 30)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('responsables', function (Blueprint $table) {
            $table->string('documento', 30)->nullable()->change();
        });
    }
};